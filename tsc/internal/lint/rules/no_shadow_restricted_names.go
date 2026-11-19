package rules

import (
	"slices"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type noShadowRestrictedNamesRule struct {
	context            Context
	referencesBySymbol map[*ast.Symbol][]*ast.Node
}

func newNoShadowRestrictedNamesRule(context Context) Rule {
	rule := &noShadowRestrictedNamesRule{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindIdentifier},
	}
}

func (rule *noShadowRestrictedNamesRule) OnEnterNode(node *ast.Node) bool {
	rule.checkRestrictedBinding(node)
	return true
}

func noShadowRestrictedNamesBinding(node *ast.Node) bool {
	if node.Kind != ast.KindIdentifier || node.Parent == nil || node.Parent.Name() != node {
		return false
	}
	switch node.Parent.Kind {
	case ast.KindVariableDeclaration, ast.KindParameter, ast.KindBindingElement, ast.KindFunctionDeclaration, ast.KindFunctionExpression, ast.KindClassDeclaration, ast.KindClassExpression, ast.KindImportClause, ast.KindNamespaceImport, ast.KindImportSpecifier:
		return true
	}
	return false
}

func (rule *noShadowRestrictedNamesRule) checkRestrictedBinding(node *ast.Node) {
	if !noShadowRestrictedNamesBinding(node) {
		return
	}
	name := node.Text()
	if !slices.Contains([]string{"undefined", "NaN", "Infinity", "arguments", "eval"}, name) && !(name == "globalThis" && helpers.SharedRuleBool(helpers.SharedRuleOptions(rule.context.Options, 0), "reportGlobalThis", true)) {
		return
	}
	if name == "undefined" {
		symbol := helpers.SharedBindingSymbol(rule.context, node)
		safe := symbol != nil
		if safe {
			for _, declaration := range symbol.Declarations() {
				if declaration.Kind != ast.KindVariableDeclaration || declaration.Initializer() != nil || declaration.Parent.Kind == ast.KindCatchClause {
					safe = false
				}
			}
			for _, reference := range helpers.SharedBindingReferences(rule.context, &rule.referencesBySymbol, symbol) {
				if ast.IsAssignmentTarget(reference) {
					safe = false
				}
			}
		}
		if safe {
			return
		}
	}
	rule.context.Report(rule.context.Range(node), diagnostics.Shadowing_of_global_property_0, name)
}
