package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
)

type noNew struct {
	context Context
}

func (rule *noNew) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindExpressionStatement && ast.SkipParentheses(node.Expression()).Kind == ast.KindNewExpression {
		rule.context.Report(rule.context.Range(node), diagnostics.Do_not_use_new_for_side_effects)
	}
	return true
}

func (rule *noNew) OnExitNode(node *ast.Node) {}

func newNoNew(context Context) Rule { return &noNew{context: context} }
