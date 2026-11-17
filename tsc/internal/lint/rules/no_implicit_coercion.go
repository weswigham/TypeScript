package rules

import (
	"slices"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/astnav"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/ls/change"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

func noImplicitCoercionNumeric(node *ast.Node) bool {
	node = ast.SkipParentheses(node)
	if node.Kind == ast.KindNumericLiteral {
		return true
	}
	if node.Kind == ast.KindCallExpression {
		callee := ast.SkipParentheses(node.Expression())
		return callee.Kind == ast.KindIdentifier && slices.Contains([]string{"Number", "parseInt", "parseFloat"}, callee.Text())
	}
	return false
}

func noImplicitCoercionString(node *ast.Node) bool {
	node = ast.SkipParentheses(node)
	if node.Kind == ast.KindStringLiteral || node.Kind == ast.KindNoSubstitutionTemplateLiteral || node.Kind == ast.KindTemplateExpression {
		return true
	}
	return node.Kind == ast.KindCallExpression && ast.SkipParentheses(node.Expression()).Kind == ast.KindIdentifier && ast.SkipParentheses(node.Expression()).Text() == "String"
}

func noImplicitCoercionEmptyString(node *ast.Node) bool {
	node = ast.SkipParentheses(node)
	return (node.Kind == ast.KindStringLiteral || node.Kind == ast.KindNoSubstitutionTemplateLiteral) && node.Text() == ""
}

type noImplicitCoercionRule struct{ context Context }

func newNoImplicitCoercionRule(context Context) Rule {
	return &noImplicitCoercionRule{context: context}
}

func (rule *noImplicitCoercionRule) OnEnterNode(node *ast.Node) bool {
	rule.checkCoercion(node)
	return true
}

func (rule *noImplicitCoercionRule) OnExitNode(node *ast.Node) {}

func (rule *noImplicitCoercionRule) checkCoercion(node *ast.Node) {
	option := helpers.SharedRuleOptions(rule.context.Options, 0)
	allowed := helpers.SharedRuleStrings(option["allow"])
	enabled := func(kind, operator string) bool {
		return helpers.SharedRuleBool(option, kind, true) && !slices.Contains(allowed, operator)
	}
	if node.Kind == ast.KindPrefixUnaryExpression {
		unary := node.AsPrefixUnaryExpression()
		operand := ast.SkipParentheses(unary.Operand)
		switch unary.Operator {
		case ast.KindExclamationToken:
			if enabled("boolean", "!!") && operand.Kind == ast.KindPrefixUnaryExpression && operand.AsPrefixUnaryExpression().Operator == ast.KindExclamationToken {
				rule.coercionReport(node, "Boolean", operand.AsPrefixUnaryExpression().Operand, true)
			}
		case ast.KindPlusToken:
			if enabled("number", "+") && !noImplicitCoercionNumeric(operand) {
				rule.coercionReport(node, "Number", operand, false)
			}
		case ast.KindMinusToken:
			if enabled("number", "- -") && operand.Kind == ast.KindPrefixUnaryExpression && operand.AsPrefixUnaryExpression().Operator == ast.KindMinusToken && !noImplicitCoercionNumeric(operand.AsPrefixUnaryExpression().Operand) {
				rule.coercionReport(node, "Number", operand.AsPrefixUnaryExpression().Operand, false)
			}
		case ast.KindTildeToken:
			if enabled("boolean", "~") && operand.Kind == ast.KindCallExpression {
				callee := ast.SkipParentheses(operand.Expression())
				name := helpers.StatementPropertyName(callee)
				if name == "indexOf" || name == "lastIndexOf" {
					comparison := " !== -1"
					if operand.Flags&ast.NodeFlagsOptionalChain != 0 {
						comparison = " >= 0"
					}
					rule.context.Report(rule.context.Range(node), diagnostics.Unexpected_implicit_coercion_encountered_Use_0_instead, rule.Text(unary.Operand)+comparison)
				}
			}
		}
	}
	if node.Kind == ast.KindBinaryExpression {
		binary := node.AsBinaryExpression()
		left, right := ast.SkipParentheses(binary.Left), ast.SkipParentheses(binary.Right)
		switch binary.OperatorToken.Kind {
		case ast.KindAsteriskToken:
			if !enabled("number", "*") || !helpers.SharedNumericLiteralEquals(left, 1) && !helpers.SharedNumericLiteralEquals(right, 1) {
				return
			}
			if helpers.SharedNumericLiteralEquals(right, 1) && node.Parent != nil && node.Parent.Kind == ast.KindBinaryExpression && node.Parent.AsBinaryExpression().OperatorToken.Kind == ast.KindSlashToken && node.Parent.AsBinaryExpression().Left == node {
				return
			}
			for _, operand := range []*ast.Node{right, left} {
				if operand.Kind != ast.KindBinaryExpression && !noImplicitCoercionNumeric(operand) {
					rule.coercionReport(node, "Number", operand, false)
					break
				}
			}
		case ast.KindMinusToken:
			if enabled("number", "-") && helpers.SharedNumericLiteralEquals(right, 0) && !noImplicitCoercionNumeric(left) {
				rule.coercionReport(node, "Number", left, false)
			}
		case ast.KindPlusToken:
			if enabled("string", "+") {
				if noImplicitCoercionEmptyString(left) && !noImplicitCoercionString(right) {
					rule.coercionReport(node, "String", right, false)
				} else if noImplicitCoercionEmptyString(right) && !noImplicitCoercionString(left) {
					rule.coercionReport(node, "String", left, false)
				}
			}
		case ast.KindPlusEqualsToken:
			if enabled("string", "+") && noImplicitCoercionEmptyString(right) {
				text := rule.Text(binary.Left)
				rule.context.Report(rule.context.Range(node), diagnostics.Unexpected_implicit_coercion_encountered_Use_0_instead, text+" = String("+text+")")
			}
		}
	}
	if node.Kind == ast.KindTemplateExpression && helpers.SharedRuleBool(option, "disallowTemplateShorthand", false) && node.Parent.Kind != ast.KindTaggedTemplateExpression {
		template := node.AsTemplateExpression()
		if template.Head.Text() == "" && len(template.TemplateSpans.Nodes) == 1 {
			span := template.TemplateSpans.Nodes[0].AsTemplateSpan()
			if span.Literal.Text() == "" && !noImplicitCoercionString(span.Expression) {
				rule.coercionReport(node, "String", span.Expression, false)
			}
		}
	}
}

func (rule *noImplicitCoercionRule) coercionReport(node *ast.Node, conversion string, operand *ast.Node, automatic bool) {
	recommendation := conversion + "(" + rule.operandText(operand) + ")"
	diagnostic := rule.context.Report(rule.context.Range(node), diagnostics.Unexpected_implicit_coercion_encountered_Use_0_instead, recommendation)
	if !automatic || rule.context.NewTracker == nil || helpers.ContainsCommentTrivia(rule.Text(node)) {
		return
	}
	symbol := rule.context.GetChecker().ResolveName(conversion, node, ast.SymbolFlagsValue, false)
	if symbol == nil || rule.context.File.AsNode().Locals().Get(conversion) != nil {
		return
	}
	for _, declaration := range symbol.Declarations() {
		if !rule.context.GetChecker().IsLibSymbolForHoverVerbosity(declaration.Symbol()) {
			return
		}
	}
	tracker := rule.context.NewTracker()
	call := tracker.NewCallExpression(tracker.NewIdentifier(conversion), nil, nil, tracker.NewNodeList([]*ast.Node{ast.SkipParentheses(operand)}), ast.NodeFlagsNone)
	options := &change.NodeOptions{LeadingTriviaOption: change.LeadingTriviaOptionExclude, TrailingTriviaOption: change.TrailingTriviaOptionExclude}
	start := scanner.GetTokenPosOfNode(node, rule.context.File, false)
	previous := astnav.FindPrecedingToken(rule.context.File, start)
	if previous != nil && previous.End() == start && (previous.Kind == ast.KindIdentifier || previous.Kind >= ast.KindFirstKeyword && previous.Kind <= ast.KindLastKeyword) {
		options.Prefix = " "
	}
	tracker.ReplaceNode(rule.context.File, node, call, options)
	diagnostic.SetCodeFixes(codefix.CreateCodeFixAction("no-implicit-coercion", tracker.GetTextChanges(), ast.NewCompilerDiagnostic(diagnostics.Use_explicit_Boolean_conversion), "no-implicit-coercion", ast.NewCompilerDiagnostic(diagnostics.Use_explicit_Boolean_conversion)))
}

func (rule *noImplicitCoercionRule) Text(node *ast.Node) string {
	return rule.context.File.Text()[scanner.GetTokenPosOfNode(node, rule.context.File, false):node.End()]
}

func (rule *noImplicitCoercionRule) operandText(node *ast.Node) string {
	node = ast.SkipParentheses(node)
	text := rule.Text(node)
	if node.Kind == ast.KindBinaryExpression && node.AsBinaryExpression().OperatorToken.Kind == ast.KindCommaToken {
		return "(" + text + ")"
	}
	return text
}
