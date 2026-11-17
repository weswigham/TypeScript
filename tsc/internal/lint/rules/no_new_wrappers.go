package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type noNewWrappers struct {
	context Context
}

func (rule *noNewWrappers) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindNewExpression {
		callee := ast.SkipParentheses(node.Expression())
		if callee.Kind == ast.KindIdentifier {
			name := callee.Text()
			if (name == "String" || name == "Number" || name == "Boolean") && helpers.StatementBuiltin(rule.context, callee, true) {
				rule.context.Report(rule.context.Range(node), diagnostics.Do_not_use_0_as_a_constructor, name)
			}
		}
	}
	return true
}

func (rule *noNewWrappers) OnExitNode(node *ast.Node) {}

func newNoNewWrappers(context Context) Rule { return &noNewWrappers{context: context} }
