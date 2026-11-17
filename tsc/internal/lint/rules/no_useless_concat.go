package rules

import (
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type noUselessConcatCoreRule struct {
	context Context
}

func newNoUselessConcatCoreRule(context Context) *noUselessConcatCoreRule {
	return &noUselessConcatCoreRule{
		context: context,
	}
}

func (rule *noUselessConcatCoreRule) OnEnterNode(node *ast.Node) bool {
	rule.checkConcat(node)
	return true
}

func (rule *noUselessConcatCoreRule) OnExitNode(node *ast.Node) {}

func (rule *noUselessConcatCoreRule) checkConcat(node *ast.Node) {
	if !literalConcatenation(node) {
		return
	}
	expression := node.AsBinaryExpression()
	left, right := ast.SkipParentheses(expression.Left), ast.SkipParentheses(expression.Right)
	for literalConcatenation(left) {
		left = ast.SkipParentheses(left.AsBinaryExpression().Right)
	}
	for literalConcatenation(right) {
		right = ast.SkipParentheses(right.AsBinaryExpression().Left)
	}
	isString := func(value *ast.Node) bool {
		return value.Kind == ast.KindStringLiteral || value.Kind == ast.KindNoSubstitutionTemplateLiteral || value.Kind == ast.KindTemplateExpression
	}
	if isString(left) && isString(right) && !strings.ContainsAny(rule.context.File.Text()[left.End():scanner.GetTokenPosOfNode(right, rule.context.File, false)], "\r\n\u2028\u2029") {
		operator := expression.OperatorToken
		rule.context.Report(core.NewTextRange(scanner.GetTokenPosOfNode(operator, rule.context.File, false), operator.End()), diagnostics.Unexpected_string_concatenation_of_literals)
	}
}

func literalConcatenation(node *ast.Node) bool {
	return node.Kind == ast.KindBinaryExpression && node.AsBinaryExpression().OperatorToken.Kind == ast.KindPlusToken
}

func newNoUselessConcatCore(context Context) Rule { return newNoUselessConcatCoreRule(context) }
