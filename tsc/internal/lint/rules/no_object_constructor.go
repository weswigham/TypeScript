package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type noObjectConstructorRule struct{ context Context }

func newNoObjectConstructorRule(context Context) Rule {
	rule := &noObjectConstructorRule{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindCallExpression, ast.KindNewExpression},
	}
}

func (rule *noObjectConstructorRule) OnEnterNode(node *ast.Node) bool {
	rule.checkConstructor(node)
	return true
}

func (rule *noObjectConstructorRule) checkConstructor(node *ast.Node) {
	if node.Kind != ast.KindNewExpression && (node.Kind != ast.KindCallExpression) {
		return
	}
	callee := ast.SkipParentheses(node.Expression())
	if callee.Kind != ast.KindIdentifier || !helpers.StatementBuiltin(rule.context, callee, true) {
		return
	}
	if callee.Text() == "Object" && len(node.Arguments()) == 0 {
		rule.context.Report(rule.context.Range(node), diagnostics.The_object_literal_notation_is_preferable)
	}
}
