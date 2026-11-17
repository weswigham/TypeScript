package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
)

type noContinue struct {
	context Context
}

func newNoContinue(context Context) Rule { return &noContinue{context: context} }

func (rule *noContinue) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindContinueStatement {
		rule.context.Report(rule.context.Range(node), diagnostics.Unexpected_use_of_continue_statement)
	}

	return true
}

func (rule *noContinue) OnExitNode(node *ast.Node) {
}
