package rules

import (
	"cmp"
	"slices"
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/ls/change"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type preferObjectSpreadRule struct {
	context    Context
	references map[*ast.Symbol][]*ast.Node
}

func newPreferObjectSpread(context Context) Rule {
	rule := &preferObjectSpreadRule{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindCallExpression},
	}
}

func (rule *preferObjectSpreadRule) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindCallExpression {
		rule.objectSpread(node)
	}

	return true
}

func (rule *preferObjectSpreadRule) builtinPath(node *ast.Node, seen map[*ast.Symbol]bool) string {
	node = ast.SkipParentheses(node)
	if object, property := helpers.DeclarationAccess(node); object != nil {
		if node.Kind == ast.KindElementAccessExpression && property.Kind != ast.KindStringLiteral && property.Kind != ast.KindNoSubstitutionTemplateLiteral {
			return ""
		}
		name := helpers.DeclarationProperty(property)
		if name != "" {
			return rule.builtinPath(object, seen) + "." + name
		}
		return ""
	}
	if node.Kind != ast.KindIdentifier {
		return ""
	}
	symbol := rule.symbol(node)
	if symbol == nil {
		if node.Text() == "Object" || node.Text() == "globalThis" {
			return node.Text()
		}
		return ""
	}
	if seen[symbol] {
		return ""
	}
	seen[symbol] = true
	if slices.ContainsFunc(rule.refs(node), ast.IsAssignmentTarget) {
		return ""
	}
	local := false
	for _, declaration := range symbol.Declarations() {
		if helpers.DeclarationContains(rule.context.File.AsNode(), declaration) && ast.GetSourceFileOfNode(declaration) == rule.context.File {
			local = true
			if declaration.Kind == ast.KindVariableDeclaration && declaration.Initializer() != nil {
				return rule.builtinPath(declaration.Initializer(), seen)
			}
			if declaration.Kind == ast.KindBindingElement && declaration.Parent.Kind == ast.KindObjectBindingPattern && declaration.Parent.Parent.Kind == ast.KindVariableDeclaration && declaration.Parent.Parent.Initializer() != nil {
				key := declaration.AsBindingElement().PropertyName
				if key == nil {
					key = declaration.Name()
				}
				return rule.builtinPath(declaration.Parent.Parent.Initializer(), seen) + "." + helpers.DeclarationProperty(key)
			}
		}
	}
	if !local && (node.Text() == "Object" || node.Text() == "globalThis") {
		return node.Text()
	}
	return ""
}

func (rule *preferObjectSpreadRule) expressionNeedsSemicolon(node *ast.Node) bool {
	current := node
	for current.Parent != nil && current.Parent.Kind != ast.KindExpressionStatement {
		parent := current.Parent
		if parent.Expression() != current && !(parent.Kind == ast.KindBinaryExpression && parent.AsBinaryExpression().Left == current) {
			return false
		}
		current = parent
	}
	if current.Parent == nil {
		return false
	}
	previous := rule.tokens(0, rule.Start(current))
	if len(previous) == 0 {
		return false
	}
	last := previous[len(previous)-1]
	switch last.Kind {
	case ast.KindSemicolonToken, ast.KindOpenBraceToken, ast.KindColonToken:
		return false
	case ast.KindCloseBraceToken:
		needs := false
		helpers.DeclarationWalk(rule.context.File.AsNode(), func(candidate *ast.Node) bool {
			if candidate.End() == last.End {
				switch candidate.Kind {
				case ast.KindVariableStatement, ast.KindExpressionStatement, ast.KindReturnStatement, ast.KindThrowStatement:
					needs = true
				}
			}
			return candidate.Pos() <= last.End
		})
		return needs
	}
	return true
}

func (rule *preferObjectSpreadRule) fix(report *ast.Diagnostic, tracker *change.Tracker) {
	changes := tracker.GetTextChanges()
	for index := range changes {
		edits := changes[index].TextChanges
		if len(edits) < 2 {
			continue
		}
		slices.SortStableFunc(edits, func(left, right core.TextChange) int {
			if order := cmp.Compare(left.Pos(), right.Pos()); order != 0 {
				return order
			}
			return cmp.Compare(left.End(), right.End())
		})
		start, end := edits[0].Pos(), edits[0].Pos()
		var text strings.Builder
		for _, edit := range edits {
			if edit.Pos() < end {
				return
			}
			text.WriteString(rule.context.File.Text()[end:edit.Pos()])
			text.WriteString(edit.NewText)
			end = edit.End()
		}
		changes[index].TextChanges = []core.TextChange{{TextRange: core.NewTextRange(start, end), NewText: text.String()}}
	}
	report.SetCodeFixes(codefix.CreateCodeFixAction("prefer-object-spread", changes, ast.NewCompilerDiagnostic(diagnostics.Fix_0, "prefer-object-spread"), "prefer-object-spread", ast.NewCompilerDiagnostic(diagnostics.Fix_0, "prefer-object-spread")))
}

func (rule *preferObjectSpreadRule) objectSpread(node *ast.Node) {
	path := rule.builtinPath(node.Expression(), make(map[*ast.Symbol]bool))
	if path != "Object.assign" && path != "globalThis.Object.assign" {
		return
	}
	arguments := node.Arguments()
	if len(arguments) == 0 || ast.SkipParentheses(arguments[0]).Kind != ast.KindObjectLiteralExpression {
		return
	}
	for index, argument := range arguments {
		if argument.Kind == ast.KindSpreadElement {
			return
		}
		argument = ast.SkipParentheses(argument)
		if argument.Kind == ast.KindObjectLiteralExpression && len(arguments) > 1 {
			for _, property := range argument.AsObjectLiteralExpression().Properties.Nodes {
				if property.Kind == ast.KindGetAccessor || property.Kind == ast.KindSetAccessor || index > 0 && property.Name() != nil && helpers.DeclarationProperty(property.Name()) == "__proto__" {
					return
				}
			}
		}
	}
	message := diagnostics.Use_an_object_spread_instead_of_Object_assign_eg_Colon_foo
	if len(arguments) == 1 {
		message = diagnostics.Use_an_object_literal_instead_of_Object_assign_eg_Colon_foo_Colon_bar
	}
	report := rule.context.Report(rule.context.Range(node), message)
	if rule.context.NewTracker == nil {
		return
	}
	tracker := rule.context.NewTracker()
	open := -1
	for _, token := range rule.tokens(node.Expression().End(), node.AsCallExpression().Arguments.Pos()) {
		if token.Kind == ast.KindOpenParenToken && token.End <= node.AsCallExpression().Arguments.Pos() {
			open = token.Start
		}
	}
	if open < 0 {
		return
	}
	parent := node.Parent
	parens := true
	if parent != nil {
		switch parent.Kind {
		case ast.KindVariableDeclaration, ast.KindArrayLiteralExpression, ast.KindReturnStatement, ast.KindCallExpression, ast.KindPropertyAssignment, ast.KindParenthesizedExpression:
			parens = false
		case ast.KindBinaryExpression:
			parens = !ast.IsAssignmentOperator(parent.AsBinaryExpression().OperatorToken.Kind) || parent.AsBinaryExpression().Left == node
		}
	}
	left, right := "{", "}"
	if parens {
		left, right = "({", "})"
		if rule.expressionNeedsSemicolon(node) {
			left = ";" + left
		}
	}
	rule.replace(tracker, rule.Start(node), open+1, left)
	rule.replace(tracker, node.End()-1, node.End(), right)
	for _, argument := range arguments {
		inner := ast.SkipParentheses(argument)
		if inner.Kind != ast.KindObjectLiteralExpression {
			prefix, suffix := "...", ""
			if inner == argument && (inner.Kind == ast.KindArrowFunction || inner.Kind == ast.KindConditionalExpression || inner.Kind == ast.KindBinaryExpression && ast.IsAssignmentOperator(inner.AsBinaryExpression().OperatorToken.Kind)) {
				prefix, suffix = "...(", ")"
			}
			rule.replace(tracker, rule.Start(argument), rule.Start(argument), prefix)
			if suffix != "" {
				rule.replace(tracker, argument.End(), argument.End(), suffix)
			}
			continue
		}
		for _, token := range rule.tokens(rule.Start(argument), rule.Start(inner)) {
			if token.Kind == ast.KindOpenParenToken {
				rule.replace(tracker, token.Start, token.End, "")
			}
		}
		for _, token := range rule.tokens(inner.End(), argument.End()) {
			if token.Kind == ast.KindCloseParenToken {
				rule.replace(tracker, token.Start, token.End, "")
			}
		}
		start, end := rule.Start(inner), inner.End()-1
		leftEnd := start + 1
		text := rule.context.File.Text()
		for leftEnd < end && strings.ContainsRune(" \t\r\n\v\f", rune(text[leftEnd])) {
			leftEnd++
		}
		rightStart := end
		for rightStart > leftEnd && strings.ContainsRune(" \t\r\n\v\f", rune(text[rightStart-1])) {
			rightStart--
		}
		if strings.Contains(text[leftEnd:rightStart], "//") {
			rightStart = end
		}
		rule.replace(tracker, start, leftEnd, "")
		rule.replace(tracker, rightStart, end+1, "")
		properties := inner.AsObjectLiteralExpression().Properties
		if len(properties.Nodes) == 0 || properties.HasTrailingComma() {
			for _, token := range rule.tokens(argument.End(), node.End()) {
				if token.Kind == ast.KindCommaToken {
					rule.replace(tracker, token.Start, token.End, "")
				}
				break
			}
		}
	}
	rule.fix(report, tracker)
}

func (rule *preferObjectSpreadRule) refs(node *ast.Node) []*ast.Node {
	if rule.references == nil {
		rule.references = make(map[*ast.Symbol][]*ast.Node)
		helpers.DeclarationWalk(rule.context.File.AsNode(), func(current *ast.Node) bool {
			if helpers.DeclarationReference(current) {
				if symbol := rule.symbol(current); symbol != nil {
					rule.references[symbol] = append(rule.references[symbol], current)
				}
			}
			return true
		})
	}
	return rule.references[rule.symbol(node)]
}

func (rule *preferObjectSpreadRule) replace(tracker *change.Tracker, start, end int, text string) {
	tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(start, end), text)
}

func (rule *preferObjectSpreadRule) Start(node *ast.Node) int {
	return scanner.GetTokenPosOfNode(node, rule.context.File, false)
}

func (rule *preferObjectSpreadRule) symbol(node *ast.Node) *ast.Symbol {
	if rule.context.GetChecker == nil {
		return nil
	}
	if node.Parent != nil && node.Parent.Kind == ast.KindShorthandPropertyAssignment {
		return rule.context.GetChecker().GetShorthandAssignmentValueSymbol(node.Parent)
	}
	return rule.context.GetChecker().GetSymbolAtLocation(node)
}

func (rule *preferObjectSpreadRule) tokens(start, end int) []helpers.DeclarationToken {
	lexer := scanner.NewScanner()
	lexer.SetText(rule.context.File.Text())
	lexer.SetSkipTrivia(true)
	lexer.ResetPos(start)
	var result []helpers.DeclarationToken
	for kind := lexer.Scan(); kind != ast.KindEndOfFile && lexer.TokenStart() < end; kind = lexer.Scan() {
		result = append(result, helpers.DeclarationToken{Kind: kind, Start: lexer.TokenStart(), End: lexer.TokenEnd()})
	}
	return result
}
