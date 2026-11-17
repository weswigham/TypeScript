package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type noVoid struct {
	context Context
}

func (rule *noVoid) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindVoidExpression {
		if helpers.ExpressionBooleanOption(rule.context, "allowAsStatement", false) {
			_, parent := helpers.OuterParenthesizedNodeAndParent(node)
			if parent != nil && parent.Kind == ast.KindExpressionStatement {
				return true
			}
		}
		rule.context.Report(rule.context.Range(node), diagnostics.Expected_undefined_and_instead_saw_void)
	}
	return true
}

func (rule *noVoid) OnExitNode(node *ast.Node) {}

func newNoVoid(context Context) Rule { return &noVoid{context: context} }
