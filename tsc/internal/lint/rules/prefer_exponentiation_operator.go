package rules

import (
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/astnav"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type preferExponentiationOperatorRule struct {
	context      Context
	writes       map[*ast.Symbol]bool
	globalWrites map[string]bool
}

func (rule *preferExponentiationOperatorRule) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindSourceFile {
		rule.writes = make(map[*ast.Symbol]bool)
		rule.globalWrites = make(map[string]bool)
		var visit func(*ast.Node)
		visit = func(current *ast.Node) {
			if current.Kind == ast.KindIdentifier && ast.IsWriteAccess(current) && !helpers.TsScopeDeclaration(current) {
				if expressionGlobalReference(rule.context, current) {
					rule.globalWrites[current.Text()] = true
				} else if symbol := rule.context.GetChecker().GetSymbolAtLocation(current); symbol != nil {
					rule.writes[symbol] = true
				}
			}
			current.ForEachChild(func(child *ast.Node) bool { visit(child); return false })
		}
		visit(node)
	}
	rule.exponentiation(node)

	return true
}

func (rule *preferExponentiationOperatorRule) OnExitNode(node *ast.Node) {}

func (rule *preferExponentiationOperatorRule) Suggestions() map[*ast.Diagnostic][]*codefix.CodeFixAction {
	return nil
}

func (rule *preferExponentiationOperatorRule) comments(start, end int) bool {
	lexer := scanner.NewScanner()
	lexer.SetText(rule.context.File.Text()[start:end])
	lexer.SetSkipTrivia(false)
	for kind := lexer.Scan(); kind != ast.KindEndOfFile; kind = lexer.Scan() {
		if kind == ast.KindSingleLineCommentTrivia || kind == ast.KindMultiLineCommentTrivia {
			return true
		}
	}
	return false
}

func (rule *preferExponentiationOperatorRule) exponentiation(node *ast.Node) {
	if node.Kind != ast.KindCallExpression || rule.mathReference(node.Expression(), make(map[*ast.Symbol]bool)) != "pow" {
		return
	}
	diagnostic := rule.context.Report(rule.context.Range(node), diagnostics.Use_the_Asterisk_Asterisk_operator_instead_of_Math_pow)
	arguments := node.AsCallExpression().Arguments
	if rule.context.NewTracker == nil || arguments == nil || len(arguments.Nodes) != 2 || arguments.Nodes[0].Kind == ast.KindSpreadElement || arguments.Nodes[1].Kind == ast.KindSpreadElement || rule.comments(rule.Start(node), node.End()) {
		return
	}
	base, baseWrapped := rule.powerOperand(arguments.Nodes[0], true)
	exponent, _ := rule.powerOperand(arguments.Nodes[1], false)
	wrapped := false
	parent := node.Parent
	if parent != nil {
		switch parent.Kind {
		case ast.KindPropertyAccessExpression, ast.KindTaggedTemplateExpression, ast.KindNonNullExpression, ast.KindAsExpression, ast.KindSatisfiesExpression, ast.KindExpressionWithTypeArguments, ast.KindTypeAssertionExpression, ast.KindClassDeclaration, ast.KindClassExpression:
			wrapped = true
		case ast.KindElementAccessExpression, ast.KindCallExpression, ast.KindNewExpression:
			wrapped = parent.Expression() == node
		case ast.KindPrefixUnaryExpression, ast.KindTypeOfExpression, ast.KindVoidExpression, ast.KindDeleteExpression, ast.KindAwaitExpression, ast.KindPostfixUnaryExpression:
			wrapped = true
		case ast.KindBinaryExpression:
			wrapped = parent.AsBinaryExpression().OperatorToken.Kind == ast.KindAsteriskAsteriskToken && parent.AsBinaryExpression().Left == node
		}
	}
	statement := node
	for statement.Parent != nil && ast.IsExpression(statement.Parent) {
		statement = statement.Parent
	}
	startsStatement := statement.Parent != nil && statement.Parent.Kind == ast.KindExpressionStatement && rule.Start(statement) == rule.Start(node)
	if startsStatement && !baseWrapped {
		first := ast.GetLeftmostExpression(ast.SkipParentheses(arguments.Nodes[0]), false)
		switch first.Kind {
		case ast.KindObjectLiteralExpression, ast.KindFunctionExpression, ast.KindClassExpression:
			wrapped = true
		}
	}
	replacement := base + " ** " + exponent
	if wrapped {
		replacement = "(" + replacement + ")"
	}
	file := rule.context.File
	text := file.Text()
	start := rule.Start(node)
	if previous := astnav.FindPrecedingToken(file, start); previous != nil && previous.End() == start {
		if (replacement[0] == '+' && (previous.Kind == ast.KindPlusToken || previous.Kind == ast.KindPlusPlusToken)) || (replacement[0] == '-' && (previous.Kind == ast.KindMinusToken || previous.Kind == ast.KindMinusMinusToken)) {
			replacement = " " + replacement
		}
	}
	lexer := scanner.NewScanner()
	lexer.SetText(text[node.End():])
	if kind := lexer.Scan(); lexer.TokenStart() == 0 && (kind == ast.KindInKeyword || kind == ast.KindInstanceOfKeyword) {
		replacement += " "
	}
	tracker := rule.context.NewTracker()
	tracker.ReplaceTextRangeWithText(file, core.NewTextRange(start, node.End()), replacement)
	lexer.SetText(replacement)
	first := lexer.Scan()
	continuation := first == ast.KindOpenParenToken || first == ast.KindOpenBracketToken || first == ast.KindSlashToken || first == ast.KindSlashEqualsToken || first == ast.KindNoSubstitutionTemplateLiteral || first == ast.KindTemplateHead
	if startsStatement && continuation {
		statement = statement.Parent
		if parent := statement.Parent; parent != nil {
			switch parent.Kind {
			case ast.KindSourceFile, ast.KindBlock, ast.KindModuleBlock, ast.KindCaseClause, ast.KindDefaultClause:
				for index, sibling := range parent.Statements() {
					if sibling != statement || index == 0 {
						continue
					}
					previous := parent.Statements()[index-1]
					if (ast.IsStatementButNotDeclaration(previous) || previous.Kind == ast.KindVariableStatement) && previous.Kind != ast.KindBlock && previous.Kind != ast.KindEmptyStatement && text[previous.End()-1] != ';' {
						tracker.ReplaceTextRangeWithText(file, core.NewTextRange(previous.End(), previous.End()), ";")
					}
				}
			}
		}
	}
	diagnostic.SetCodeFixes(codefix.CreateCodeFixAction("prefer-exponentiation-operator", tracker.GetTextChanges(), ast.NewCompilerDiagnostic(diagnostics.Fix_0, "prefer-exponentiation-operator"), "prefer-exponentiation-operator", ast.NewCompilerDiagnostic(diagnostics.Fix_all_0, "prefer-exponentiation-operator")))
}

func (rule *preferExponentiationOperatorRule) mathReference(node *ast.Node, seen map[*ast.Symbol]bool) string {
	node = ast.SkipParentheses(node)
	if ast.IsAccessExpression(node) {
		base := rule.mathReference(node.Expression(), seen)
		property, ok := rule.staticString(nodePropertyExpression(node))
		if node.Kind == ast.KindPropertyAccessExpression {
			property, ok = node.Name().Text(), node.Name().Kind == ast.KindIdentifier
		}
		if !ok {
			return ""
		}
		if base == "global" && property == "Math" {
			return "Math"
		}
		if base == "global" && (property == "globalThis" || property == "window" || property == "self" || property == "global") {
			return "global"
		}
		if base == "Math" && property == "pow" {
			return "pow"
		}
		return ""
	}
	if node.Kind != ast.KindIdentifier {
		return ""
	}
	if expressionGlobalReference(rule.context, node) {
		if rule.globalWrites[node.Text()] {
			return ""
		}
		switch node.Text() {
		case "Math":
			return "Math"
		case "globalThis", "window", "self", "global":
			return "global"
		}
		return ""
	}
	symbol := rule.context.GetChecker().GetSymbolAtLocation(node)
	if symbol == nil || seen[symbol] || rule.writes[symbol] || len(symbol.Declarations()) != 1 {
		return ""
	}
	seen[symbol] = true
	defer delete(seen, symbol)
	for _, declaration := range symbol.Declarations() {
		if declaration.Kind == ast.KindVariableDeclaration && declaration.Initializer() != nil {
			return rule.mathReference(declaration.Initializer(), seen)
		}
		if declaration.Kind == ast.KindBindingElement {
			element := declaration.AsBindingElement()
			if element.DotDotDotToken != nil || element.Initializer != nil {
				continue
			}
			pattern := declaration.Parent
			if pattern.Kind != ast.KindObjectBindingPattern || pattern.Parent.Kind != ast.KindVariableDeclaration || pattern.Parent.Initializer() == nil {
				continue
			}
			base := rule.mathReference(pattern.Parent.Initializer(), seen)
			property := element.PropertyName
			if property == nil {
				property = element.Name()
			}
			name := property.Text()
			if base == "Math" && name == "pow" {
				return "pow"
			}
			if base == "global" && name == "Math" {
				return "Math"
			}
		}
	}
	return ""
}

func (rule *preferExponentiationOperatorRule) powerOperand(node *ast.Node, base bool) (string, bool) {
	node = ast.SkipParentheses(node)
	result := rule.context.File.Text()[rule.Start(node):node.End()]
	precedence := ast.GetExpressionPrecedence(node)
	unary := false
	switch node.Kind {
	case ast.KindPrefixUnaryExpression:
		operator := node.AsPrefixUnaryExpression().Operator
		unary = operator != ast.KindPlusPlusToken && operator != ast.KindMinusMinusToken
	case ast.KindDeleteExpression, ast.KindTypeOfExpression, ast.KindVoidExpression, ast.KindAwaitExpression, ast.KindTypeAssertionExpression:
		unary = true
	}
	wrapped := precedence < ast.OperatorPrecedenceExponentiation || base && (precedence == ast.OperatorPrecedenceExponentiation || unary)
	if wrapped {
		result = "(" + result + ")"
	}
	return result, wrapped
}

func (rule *preferExponentiationOperatorRule) Start(node *ast.Node) int {
	return scanner.GetTokenPosOfNode(node, rule.context.File, false)
}

func (rule *preferExponentiationOperatorRule) staticString(node *ast.Node) (string, bool) {
	if node == nil {
		return "", false
	}
	node = ast.SkipParentheses(node)
	if node.Kind == ast.KindStringLiteral || node.Kind == ast.KindNoSubstitutionTemplateLiteral {
		return node.Text(), true
	}
	if node.Kind == ast.KindTemplateExpression {
		expression := node.AsTemplateExpression()
		var value strings.Builder
		value.WriteString(expression.Head.Text())
		for _, span := range expression.TemplateSpans.Nodes {
			text, ok := rule.staticString(span.Expression())
			if !ok {
				return "", false
			}
			value.WriteString(text)
			value.WriteString(span.AsTemplateSpan().Literal.Text())
		}
		return value.String(), true
	}
	if node.Kind == ast.KindBinaryExpression && node.AsBinaryExpression().OperatorToken.Kind == ast.KindPlusToken {
		binary := node.AsBinaryExpression()
		left, leftOK := rule.staticString(binary.Left)
		right, rightOK := rule.staticString(binary.Right)
		return left + right, leftOK && rightOK
	}
	return "", false
}

func nodePropertyExpression(node *ast.Node) *ast.Node {
	if node.Kind == ast.KindElementAccessExpression {
		return node.AsElementAccessExpression().ArgumentExpression
	}
	return node.Name()
}

func newPreferExponentiationOperator(context Context) Rule {
	return &preferExponentiationOperatorRule{context: context}
}
