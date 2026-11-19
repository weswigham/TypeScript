package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type noNewFunc struct {
	context Context
}

func newNoNewFunc(context Context) Rule {
	rule := &noNewFunc{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindCallExpression, ast.KindNewExpression},
	}
}

func (rule *noNewFunc) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindCallExpression || node.Kind == ast.KindNewExpression {
		callee := ast.SkipParentheses(node.Expression())
		if node.Kind == ast.KindCallExpression && ast.IsAccessExpression(callee) {
			name := helpers.StatementPropertyName(callee)
			if name != "apply" && name != "bind" && name != "call" {
				return true
			}
			callee = ast.SkipParentheses(callee.Expression())
		}
		if callee.Kind == ast.KindIdentifier && callee.Text() == "Function" && helpers.StatementBuiltin(rule.context, callee, true) {
			rule.context.Report(rule.context.Range(node), diagnostics.The_Function_constructor_is_eval)
		}
	}
	return true
}
