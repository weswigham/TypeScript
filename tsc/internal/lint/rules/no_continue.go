package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
)

type noContinue struct {
	context Context
}

func newNoContinue(context Context) Rule {
	rule := &noContinue{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindContinueStatement},
	}
}

func (rule *noContinue) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindContinueStatement {
		rule.context.Report(rule.context.Range(node), diagnostics.Unexpected_use_of_continue_statement)
	}

	return true
}
