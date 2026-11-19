package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type noUnassignedVarsRule struct {
	context            Context
	referencesBySymbol map[*ast.Symbol][]*ast.Node
}

func newNoUnassignedVarsRule(context Context) Rule {
	rule := &noUnassignedVarsRule{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindVariableDeclaration},
	}
}

func (rule *noUnassignedVarsRule) OnEnterNode(node *ast.Node) bool {
	rule.checkUnassigned(node)
	return true
}

func noUnassignedVarsAmbient(node *ast.Node) bool {
	for current := node; current != nil; current = current.Parent {
		if current.Flags&ast.NodeFlagsAmbient != 0 || ast.IsDeclaration(current) && ast.GetCombinedModifierFlags(current)&ast.ModifierFlagsAmbient != 0 {
			return true
		}
	}
	return false
}

func (rule *noUnassignedVarsRule) checkUnassigned(node *ast.Node) {
	if node.Kind != ast.KindVariableDeclaration || node.Initializer() != nil || node.Name().Kind != ast.KindIdentifier || node.Parent.Kind != ast.KindVariableDeclarationList || node.Parent.Flags&ast.NodeFlagsConst != 0 || noUnassignedVarsAmbient(node) {
		return
	}
	if ast.IsForInOrOfStatement(node.Parent.Parent) {
		return
	}
	symbol := helpers.SharedBindingSymbol(rule.context, node.Name())
	if symbol == nil {
		return
	}
	for _, declaration := range symbol.Declarations() {
		if declaration.Initializer() != nil || declaration.Parent != nil && declaration.Parent.Kind == ast.KindVariableDeclarationList && ast.IsForInOrOfStatement(declaration.Parent.Parent) {
			return
		}
	}
	hasRead := false
	for _, reference := range helpers.SharedBindingReferences(rule.context, &rule.referencesBySymbol, symbol) {
		if ast.IsAssignmentTarget(reference) {
			return
		}
		hasRead = true
	}
	if hasRead {
		rule.context.Report(rule.context.Range(node), diagnostics.X_0_is_always_undefined_because_it_s_never_assigned, node.Name().Text())
	}
}
