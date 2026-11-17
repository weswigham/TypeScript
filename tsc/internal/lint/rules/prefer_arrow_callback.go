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

type preferArrowCallbackRule struct {
	context    Context
	references map[*ast.Symbol][]*ast.Node
}

func (rule *preferArrowCallbackRule) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindFunctionExpression {
		rule.arrowCallback(node)
	}

	return true
}

func (rule *preferArrowCallbackRule) OnExitNode(node *ast.Node) {}

func (rule *preferArrowCallbackRule) Suggestions() map[*ast.Diagnostic][]*codefix.CodeFixAction {
	return nil
}

func (rule *preferArrowCallbackRule) arrowCallback(node *ast.Node) {
	function := node.AsFunctionExpression()
	if function.AsteriskToken != nil || node.Name() != nil && (helpers.DeclarationBool(rule.option(0), "allowNamedFunctions", false) || len(rule.refs(node.Name())) > 0) {
		return
	}
	callback, bound := rule.callbackInfo(node)
	if !callback || rule.lexical(node, ast.KindSuperKeyword) || rule.lexical(node, ast.KindMetaProperty) {
		return
	}
	usesArguments := false
	helpers.DeclarationWalk(node, func(current *ast.Node) bool {
		if current != node && ast.IsFunctionLike(current) && current.Kind != ast.KindArrowFunction {
			return false
		}
		if current.Kind == ast.KindIdentifier && current.Text() == "arguments" && helpers.DeclarationReference(current) {
			symbol := rule.symbol(current)
			local := false
			if symbol != nil {
				for _, declaration := range symbol.Declarations() {
					if helpers.DeclarationContains(node, declaration) && (ast.GetRootDeclaration(declaration).Kind == ast.KindParameter || ast.GetRootDeclaration(declaration).Kind == ast.KindVariableDeclaration) {
						local = true
					}
				}
			}
			if !local {
				usesArguments = true
			}
		}
		return true
	})
	if usesArguments {
		return
	}
	usesThis := rule.lexical(node, ast.KindThisKeyword)
	if usesThis && bound == nil && helpers.DeclarationBool(rule.option(0), "allowUnboundThis", true) {
		return
	}
	report := rule.context.Report(rule.context.Range(node), diagnostics.Unexpected_function_expression)
	if rule.context.NewTracker == nil || usesThis && bound == nil {
		return
	}
	seen := make(map[string]bool)
	for _, parameter := range node.Parameters() {
		if parameter.Name().Kind == ast.KindIdentifier {
			name := parameter.Name().Text()
			if name == "this" || seen[name] {
				return
			}
			seen[name] = true
		}
	}
	tokens := rule.tokens(rule.Start(node), rule.Start(node.Body()))
	functionToken, open, beforeBody := helpers.DeclarationToken{}, helpers.DeclarationToken{}, helpers.DeclarationToken{}
	for _, token := range tokens {
		if token.Kind == ast.KindFunctionKeyword {
			functionToken = token
		}
		if token.Kind == ast.KindOpenParenToken && token.End <= node.ParameterList().Pos() {
			open = token
		}
		beforeBody = token
	}
	if open.End == 0 || functionToken.End == 0 {
		return
	}
	if ast.GetCombinedModifierFlags(node)&ast.ModifierFlagsAsync != 0 && strings.ContainsAny(rule.context.File.Text()[functionToken.End:open.Start], "\r\n\u2028\u2029") {
		return
	}
	tracker := rule.context.NewTracker()
	replaced := node
	if bound != nil {
		member := bound.Expression()
		if member.Kind != ast.KindPropertyAccessExpression || ast.SkipParentheses(member.Expression()) != node || helpers.DeclarationComment(rule.context.File.Text()[member.Expression().End():bound.End()]) {
			return
		}
		rule.replace(tracker, member.Expression().End(), bound.End(), "")
		replaced = bound
	}
	headerEnd := open.Start
	if len(node.TypeParameters()) > 0 {
		for _, token := range tokens {
			if token.Kind == ast.KindLessThanToken {
				headerEnd = token.Start
				break
			}
		}
	}
	if helpers.DeclarationComment(rule.context.File.Text()[functionToken.End:headerEnd]) {
		rule.replace(tracker, functionToken.Start, functionToken.End, "")
		if node.Name() != nil {
			rule.replace(tracker, rule.Start(node.Name()), node.Name().End(), "")
		}
	} else {
		rule.replace(tracker, functionToken.Start, headerEnd, "")
	}
	rule.replace(tracker, beforeBody.End, beforeBody.End, " =>")
	parent := replaced.Parent
	if parent != nil && parent.Kind != ast.KindCallExpression && parent.Kind != ast.KindConditionalExpression && parent.Kind != ast.KindParenthesizedExpression && node.Parent.Kind != ast.KindParenthesizedExpression {
		rule.replace(tracker, rule.Start(replaced), rule.Start(replaced), "(")
		rule.replace(tracker, replaced.End(), replaced.End(), ")")
	}
	rule.fix(report, tracker)
}

func (rule *preferArrowCallbackRule) callbackInfo(function *ast.Node) (bool, *ast.Node) {
	current := helpers.DeclarationOuter(function)
	var bound *ast.Node
	firstBind := true
	for current.Parent != nil {
		parent := current.Parent
		switch parent.Kind {
		case ast.KindConditionalExpression:
			if parent.AsConditionalExpression().Condition == current {
				return false, nil
			}
			current = helpers.DeclarationOuter(parent)
		case ast.KindBinaryExpression:
			switch parent.AsBinaryExpression().OperatorToken.Kind {
			case ast.KindBarBarToken, ast.KindAmpersandAmpersandToken, ast.KindQuestionQuestionToken:
				current = helpers.DeclarationOuter(parent)
			default:
				return false, nil
			}
		case ast.KindPropertyAccessExpression:
			if parent.Expression() != current || parent.Name().Text() != "bind" {
				return false, nil
			}
			callee := helpers.DeclarationOuter(parent)
			if callee.Parent == nil || callee.Parent.Kind != ast.KindCallExpression || callee.Parent.Expression() != callee {
				return false, nil
			}
			call := callee.Parent
			if firstBind {
				if len(call.Arguments()) == 1 && call.Arguments()[0].Kind == ast.KindThisKeyword {
					bound = call
				}
				firstBind = false
			}
			current = helpers.DeclarationOuter(call)
		case ast.KindCallExpression, ast.KindNewExpression:
			return parent.Expression() != current, bound
		default:
			return false, nil
		}
	}
	return false, nil
}

func (rule *preferArrowCallbackRule) fix(report *ast.Diagnostic, tracker *change.Tracker) {
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
	report.SetCodeFixes(codefix.CreateCodeFixAction("prefer-arrow-callback", changes, ast.NewCompilerDiagnostic(diagnostics.Fix_0, "prefer-arrow-callback"), "prefer-arrow-callback", ast.NewCompilerDiagnostic(diagnostics.Fix_0, "prefer-arrow-callback")))
}

func (rule *preferArrowCallbackRule) lexical(function *ast.Node, kind ast.Kind) bool {
	found := false
	var visit func(*ast.Node)
	visit = func(node *ast.Node) {
		if node == nil || found {
			return
		}
		if node != function && ast.IsFunctionLike(node) && node.Kind != ast.KindArrowFunction {
			if node.Name() != nil && node.Name().Kind == ast.KindComputedPropertyName {
				visit(node.Name())
			}
			return
		}
		if node.Kind == ast.KindClassStaticBlockDeclaration || node.Kind == ast.KindPropertyDeclaration {
			if node.Name() != nil && node.Name().Kind == ast.KindComputedPropertyName {
				visit(node.Name())
			}
			return
		}
		if node.Kind == kind || kind == ast.KindUnknown && (node.Kind == ast.KindThisKeyword || node.Kind == ast.KindSuperKeyword || node.Kind == ast.KindMetaProperty) {
			if node.Kind != ast.KindMetaProperty || strings.HasPrefix(rule.Text(node), "new") {
				found = true
			}
		}
		if kind == ast.KindUnknown && node.Kind == ast.KindIdentifier && node.Text() == "arguments" && helpers.DeclarationReference(node) {
			found = true
		}
		node.ForEachChild(func(child *ast.Node) bool { visit(child); return false })
	}
	visit(function)
	return found
}

func (rule *preferArrowCallbackRule) option(index int) map[string]any {
	if index < len(rule.context.Options) {
		value, _ := rule.context.Options[index].(map[string]any)
		return value
	}
	return nil
}

func (rule *preferArrowCallbackRule) refs(node *ast.Node) []*ast.Node {
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

func (rule *preferArrowCallbackRule) replace(tracker *change.Tracker, start, end int, text string) {
	tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(start, end), text)
}

func (rule *preferArrowCallbackRule) Start(node *ast.Node) int {
	return scanner.GetTokenPosOfNode(node, rule.context.File, false)
}

func (rule *preferArrowCallbackRule) symbol(node *ast.Node) *ast.Symbol {
	if rule.context.GetChecker == nil {
		return nil
	}
	if node.Parent != nil && node.Parent.Kind == ast.KindShorthandPropertyAssignment {
		return rule.context.GetChecker().GetShorthandAssignmentValueSymbol(node.Parent)
	}
	return rule.context.GetChecker().GetSymbolAtLocation(node)
}

func (rule *preferArrowCallbackRule) Text(node *ast.Node) string {
	return rule.context.File.Text()[rule.Start(node):node.End()]
}

func (rule *preferArrowCallbackRule) tokens(start, end int) []helpers.DeclarationToken {
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

func newPreferArrowCallback(context Context) Rule { return &preferArrowCallbackRule{context: context} }
