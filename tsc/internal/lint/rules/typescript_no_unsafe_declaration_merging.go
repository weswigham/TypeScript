package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type typescriptNoUnsafeDeclarationMergingRule struct {
	helpers.TypescriptScopeRuleContext
}

func (rule *typescriptNoUnsafeDeclarationMergingRule) OnEnterNode(node *ast.Node) bool {
	rule.unsafeMerging(node)
	return true
}

func (rule *typescriptNoUnsafeDeclarationMergingRule) OnExitNode(node *ast.Node) {}

func (rule *typescriptNoUnsafeDeclarationMergingRule) unsafeMerging(node *ast.Node) {
	if node.Kind != ast.KindClassDeclaration && node.Kind != ast.KindInterfaceDeclaration || node.Name() == nil {
		return
	}
	binding := rule.Bindings().Decls[node.Name()]
	if binding == nil {
		return
	}
	for _, declaration := range binding.Declarations {
		if declaration.Kind != node.Kind && (declaration.Kind == ast.KindClassDeclaration || declaration.Kind == ast.KindInterfaceDeclaration) {
			rule.Context.Report(rule.Context.Range(node.Name()), diagnostics.Unsafe_declaration_merging_between_classes_and_interfaces)
			return
		}
	}
}

func newTypeScriptNoUnsafeDeclarationMerging(context Context) Rule {
	return &typescriptNoUnsafeDeclarationMergingRule{Context: context, Name: "no-unsafe-declaration-merging"}
}
