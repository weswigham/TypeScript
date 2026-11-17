package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type typescriptNoUseBeforeDefineRule struct {
	helpers.TypescriptScopeRuleContext
}

func (rule *typescriptNoUseBeforeDefineRule) OnEnterNode(node *ast.Node) bool {
	return true
}

func (rule *typescriptNoUseBeforeDefineRule) OnExitNode(node *ast.Node) {
	if node.Kind != ast.KindSourceFile {
		return
	}
	for _, binding := range rule.Bindings().Bindings {
		rule.beforeDefine(binding)
	}
}

func (rule *typescriptNoUseBeforeDefineRule) beforeDefine(binding *helpers.TsScopeBinding) {
	declaration, identifier := binding.Declarations[0], binding.Identifiers[0]
	root := helpers.TsScopeRootBinding(declaration)
	for _, reference := range binding.References {
		node := reference.Node
		if reference.TypeOnly && rule.Boolean("ignoreTypeReferences", true) {
			continue
		}
		if node.Parent.Kind == ast.KindExportSpecifier && rule.Boolean("allowNamedExports", false) {
			continue
		}
		selfInitializer := helpers.TsScopeInitializer(root) != nil && helpers.TsScopeContains(helpers.TsScopeInitializer(root), node) && helpers.TsScopeFunction(root) == helpers.TsScopeFunction(node)
		for current := declaration; current != root; current = current.Parent {
			if helpers.TsScopeContains(helpers.TsScopeInitializer(current), node) && helpers.TsScopeFunction(current) == helpers.TsScopeFunction(node) {
				selfInitializer = true
			}
		}
		if root.Kind == ast.KindVariableDeclaration && root.Parent.Kind == ast.KindVariableDeclarationList && ast.IsForInOrOfStatement(root.Parent.Parent) && helpers.TsScopeContains(root.Parent.Parent.Expression(), node) {
			selfInitializer = true
		}
		if identifier.End() <= node.End() && !selfInitializer {
			continue
		}
		if declaration.Kind == ast.KindFunctionDeclaration && (!rule.Boolean("functions", true) || rule.Mode("") == "nofunc") {
			continue
		}
		if (declaration.Kind == ast.KindTypeAliasDeclaration || declaration.Kind == ast.KindInterfaceDeclaration || declaration.Kind == ast.KindTypeParameter) && !rule.Boolean("typedefs", true) {
			continue
		}
		if helpers.TsScopeFunction(declaration.Parent) != helpers.TsScopeFunction(node) {
			option := "variables"
			if declaration.Kind == ast.KindClassDeclaration {
				option = "classes"
			} else if declaration.Kind == ast.KindEnumDeclaration {
				option = "enums"
			}
			if !rule.Boolean(option, true) {
				continue
			}
		}
		inDecorator, signature := false, false
		for current := node.Parent; current != nil; current = current.Parent {
			if current.Kind == ast.KindDecorator && declaration.Kind == ast.KindClassDeclaration && helpers.TsScopeContains(declaration, current) {
				inDecorator = true
			}
			if helpers.TsScopeSignature(current) {
				signature = true
			}
			if ast.IsStatement(current) {
				break
			}
		}
		if !inDecorator && !signature {
			rule.Context.Report(rule.Context.Range(node), diagnostics.X_0_was_used_before_it_was_defined, binding.Name)
		}
	}
}

func newTypeScriptNoUseBeforeDefine(context Context) Rule {
	return &typescriptNoUseBeforeDefineRule{Context: context, Name: "no-use-before-define"}
}
