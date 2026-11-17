package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type typescriptNoUnusedExpressionsRule struct {
	context Context
}

func (rule *typescriptNoUnusedExpressionsRule) OnEnterNode(node *ast.Node) bool {
	rule.unused(node)
	return true
}

func (rule *typescriptNoUnusedExpressionsRule) OnExitNode(node *ast.Node) {}

func (rule *typescriptNoUnusedExpressionsRule) unused(node *ast.Node) {
	if node.Kind != ast.KindExpressionStatement || helpers.IsDirectivePrologueStatement(node) {
		return
	}
	expression := ast.SkipParentheses(node.Expression())
	switch expression.Kind {
	case ast.KindAsExpression, ast.KindTypeAssertionExpression, ast.KindNonNullExpression, ast.KindExpressionWithTypeArguments:
		expression = ast.SkipParentheses(expression.Expression())
	}
	base := newNoUnusedExpressionsCoreRule(rule.context)
	if base.unusedExpression(expression) {
		rule.context.Report(rule.context.Range(node), diagnostics.Expected_an_assignment_or_function_call_and_instead_saw_an_expression)
	}
}

func newTypeScriptNoUnusedExpressions(context Context) Rule {
	return &typescriptNoUnusedExpressionsRule{context: context}
}
