package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
)

type noConstAssignRule struct{ context Context }

func newNoConstAssignRule(context Context) Rule {
	return &noConstAssignRule{context: context}
}

func (rule *noConstAssignRule) OnEnterNode(node *ast.Node) bool {
	rule.checkBindingWrite(node)
	return true
}

func (rule *noConstAssignRule) OnExitNode(node *ast.Node) {}

func (rule *noConstAssignRule) checkBindingWrite(node *ast.Node) {
	if node.Kind != ast.KindIdentifier || !ast.IsAssignmentTarget(node) {
		return
	}
	symbol := rule.context.GetChecker().ResolveName(node.Text(), node, ast.SymbolFlagsValue, false)
	if symbol == nil {
		return
	}
	for _, declaration := range symbol.Declarations() {
		root := ast.GetRootDeclaration(declaration)
		if root.Kind == ast.KindVariableDeclaration && ast.GetCombinedNodeFlags(root)&ast.NodeFlagsConstant != 0 {
			rule.context.Report(rule.context.Range(node), diagnostics.X_0_is_constant, node.Text())
			return
		}
	}
}
