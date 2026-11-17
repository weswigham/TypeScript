package rules

import (
	"slices"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type preferSpreadCoreRule struct {
	context Context
}

func newPreferSpreadCoreRule(context Context) *preferSpreadCoreRule {
	return &preferSpreadCoreRule{
		context: context,
	}
}

func (rule *preferSpreadCoreRule) OnEnterNode(node *ast.Node) bool {
	rule.checkCall(node)
	return true
}

func (rule *preferSpreadCoreRule) OnExitNode(node *ast.Node) {}

func (rule *preferSpreadCoreRule) checkCall(node *ast.Node) {
	if node.Kind != ast.KindCallExpression {
		return
	}
	callee := ast.SkipParentheses(node.Expression())
	if !ast.IsAccessExpression(callee) || callee.Name() != nil && callee.Name().Kind == ast.KindPrivateIdentifier {
		return
	}
	name := helpers.StatementPropertyName(callee)
	arguments := node.AsCallExpression().Arguments.Nodes
	if name != "apply" || len(arguments) != 2 || ast.SkipParentheses(arguments[1]).Kind == ast.KindArrayLiteralExpression || arguments[1].Kind == ast.KindSpreadElement {
		return
	}
	applied := ast.SkipParentheses(callee.Expression())
	thisArg := ast.SkipParentheses(arguments[0])
	validThis := false
	if ast.IsAccessExpression(applied) {
		expected := ast.SkipParentheses(applied.Expression())
		validThis = slices.Equal(expressionCaseTokens(rule.context.File, expected), expressionCaseTokens(rule.context.File, thisArg))
	} else {
		validThis = thisArg.Kind == ast.KindNullKeyword || thisArg.Kind == ast.KindIdentifier && thisArg.Text() == "undefined" || thisArg.Kind == ast.KindVoidExpression
	}
	if validThis {
		rule.context.Report(rule.context.Range(node), diagnostics.Use_the_spread_operator_instead_of_apply)
	}
}

func newPreferSpreadCore(context Context) Rule { return newPreferSpreadCoreRule(context) }
