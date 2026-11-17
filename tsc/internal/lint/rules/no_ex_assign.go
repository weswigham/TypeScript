package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
)

type noExAssignRule struct{ context Context }

func newNoExAssignRule(context Context) Rule {
	return &noExAssignRule{context: context}
}

func (rule *noExAssignRule) OnEnterNode(node *ast.Node) bool {
	rule.checkBindingWrite(node)
	return true
}

func (rule *noExAssignRule) OnExitNode(node *ast.Node) {}

func (rule *noExAssignRule) checkBindingWrite(node *ast.Node) {
	if node.Kind != ast.KindIdentifier || !ast.IsAssignmentTarget(node) {
		return
	}
	symbol := rule.context.GetChecker().ResolveName(node.Text(), node, ast.SymbolFlagsValue, false)
	if symbol == nil {
		return
	}
	for _, declaration := range symbol.Declarations() {
		root := ast.GetRootDeclaration(declaration)
		if root.Kind == ast.KindVariableDeclaration && root.Parent.Kind == ast.KindCatchClause {
			rule.context.Report(rule.context.Range(node), diagnostics.Do_not_assign_to_the_exception_parameter)
			return
		}
	}
}
