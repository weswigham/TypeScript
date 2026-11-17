package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type noWithCoreRule struct {
	context Context
}

func newNoWithCoreRule(context Context) *noWithCoreRule {
	return &noWithCoreRule{
		context: context,
	}
}

func (rule *noWithCoreRule) OnEnterNode(node *ast.Node) bool {
	rule.checkWith(node)
	return true
}

func (rule *noWithCoreRule) OnExitNode(node *ast.Node) {}

func (rule *noWithCoreRule) checkWith(node *ast.Node) {
	if node.Kind == ast.KindWithStatement {
		start := scanner.GetTokenPosOfNode(node, rule.context.File, false)
		rule.context.Report(core.NewTextRange(start, start+4), diagnostics.Unexpected_use_of_with_statement)
	}
}

func newNoWithCore(context Context) Rule { return newNoWithCoreRule(context) }
