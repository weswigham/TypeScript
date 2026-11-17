package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
)

type noTernary struct {
	context Context
}

func (rule *noTernary) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindConditionalExpression {
		rule.context.Report(rule.context.Range(node), diagnostics.Ternary_operator_used)
	}
	return true
}

func (rule *noTernary) OnExitNode(node *ast.Node) {}

func newNoTernary(context Context) Rule { return &noTernary{context: context} }
