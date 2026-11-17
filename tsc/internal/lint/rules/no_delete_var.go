package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
)

type noDeleteVar struct {
	context Context
}

func (rule *noDeleteVar) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindDeleteExpression && ast.SkipParentheses(node.Expression()).Kind == ast.KindIdentifier {
		rule.context.Report(rule.context.Range(node), diagnostics.Variables_should_not_be_deleted)
	}
	return true
}

func (rule *noDeleteVar) OnExitNode(node *ast.Node) {}

func newNoDeleteVar(context Context) Rule { return &noDeleteVar{context: context} }
