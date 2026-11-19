package rules

import (
	"slices"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type noUselessCallRule struct {
	context Context
}

func newNoUselessCall(context Context) Rule {
	rule := &noUselessCallRule{
		context: context,
	}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindCallExpression},
	}
}

func (rule *noUselessCallRule) OnEnterNode(node *ast.Node) bool {
	rule.checkCall(node)
	return true
}

func (rule *noUselessCallRule) checkCall(node *ast.Node) {
	if node.Kind != ast.KindCallExpression {
		return
	}
	callee := ast.SkipParentheses(node.Expression())
	if !ast.IsAccessExpression(callee) || callee.Name() != nil && callee.Name().Kind == ast.KindPrivateIdentifier {
		return
	}
	name := helpers.StatementPropertyName(callee)
	arguments := node.AsCallExpression().Arguments.Nodes
	if callee.Kind != ast.KindPropertyAccessExpression || !(name == "call" && len(arguments) >= 1 || name == "apply" && len(arguments) == 2 && ast.SkipParentheses(arguments[1]).Kind == ast.KindArrayLiteralExpression) {
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
		rule.context.Report(rule.context.Range(node), diagnostics.Unnecessary_0, name)
	}
}
