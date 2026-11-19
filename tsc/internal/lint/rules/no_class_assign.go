package rules

import (
	"slices"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
)

type noClassAssignRule struct{ context Context }

func newNoClassAssignRule(context Context) Rule {
	rule := &noClassAssignRule{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindIdentifier},
	}
}

func (rule *noClassAssignRule) OnEnterNode(node *ast.Node) bool {
	rule.checkBindingWrite(node)
	return true
}

func (rule *noClassAssignRule) checkBindingWrite(node *ast.Node) {
	if node.Kind != ast.KindIdentifier || !ast.IsAssignmentTarget(node) {
		return
	}
	symbol := rule.context.GetChecker().ResolveName(node.Text(), node, ast.SymbolFlagsValue, false)
	if symbol == nil {
		return
	}
	if slices.ContainsFunc(symbol.Declarations(), ast.IsClassLike) {
		rule.context.Report(rule.context.Range(node), diagnostics.X_0_is_a_class, node.Text())
		return
	}
}
