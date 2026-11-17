package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
)

type typescriptNoNamespaceRule struct {
	context Context
}

func (rule *typescriptNoNamespaceRule) OnEnterNode(node *ast.Node) bool {
	rule.namespace(node)
	return true
}

func (rule *typescriptNoNamespaceRule) OnExitNode(node *ast.Node) {}

func (rule *typescriptNoNamespaceRule) namespace(node *ast.Node) {
	if node.Kind != ast.KindModuleDeclaration || node.Name().Kind == ast.KindStringLiteral || node.Name().Text() == "global" || node.Parent.Kind == ast.KindModuleDeclaration {
		return
	}
	if rule.Boolean("allowDefinitionFiles", true) && rule.context.File.IsDeclarationFile {
		return
	}
	if rule.Boolean("allowDeclarations", false) {
		for ancestor := node; ancestor != nil; ancestor = ancestor.Parent {
			if ancestor.Kind == ast.KindModuleDeclaration && ast.HasSyntacticModifier(ancestor, ast.ModifierFlagsAmbient) {
				return
			}
		}
	}
	rule.context.Report(rule.context.Range(node), diagnostics.ES2015_module_syntax_is_preferred_over_namespaces)
}

func (rule *typescriptNoNamespaceRule) Boolean(name string, fallback bool) bool {
	if value, ok := rule.Options()[name].(bool); ok {
		return value
	}
	return fallback
}

func (rule *typescriptNoNamespaceRule) Options() map[string]any {
	if len(rule.context.Options) != 0 {
		options, _ := rule.context.Options[0].(map[string]any)
		return options
	}
	return nil
}

func newTypeScriptNoNamespace(context Context) Rule {
	return &typescriptNoNamespaceRule{context: context}
}
