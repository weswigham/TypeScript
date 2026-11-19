package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type noWithRule struct {
	context Context
}

func newNoWith(context Context) Rule {
	rule := &noWithRule{
		context: context,
	}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindWithStatement},
	}
}

func (rule *noWithRule) OnEnterNode(node *ast.Node) bool {
	rule.checkWith(node)
	return true
}

func (rule *noWithRule) checkWith(node *ast.Node) {
	if node.Kind == ast.KindWithStatement {
		start := scanner.GetTokenPosOfNode(node, rule.context.File, false)
		rule.context.Report(core.NewTextRange(start, start+4), diagnostics.Unexpected_use_of_with_statement)
	}
}
