package rules

import (
	"slices"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type typescriptNoRedeclareRule struct {
	helpers.TypescriptScopeRuleContext
}

func (rule *typescriptNoRedeclareRule) OnEnterNode(node *ast.Node) bool {
	return true
}

func (rule *typescriptNoRedeclareRule) OnExitNode(node *ast.Node) {
	if node.Kind != ast.KindSourceFile {
		return
	}
	for _, binding := range rule.Bindings().Bindings {
		rule.redeclare(binding)
	}
}

func (rule *typescriptNoRedeclareRule) redeclare(binding *helpers.TsScopeBinding) {
	var identifiers []*ast.Node
	for index, declaration := range binding.Declarations {
		if declaration.Kind == ast.KindFunctionDeclaration && declaration.Body() == nil {
			continue
		}
		identifiers = append(identifiers, binding.Identifiers[index])
	}
	if rule.Boolean("ignoreDeclarationMerge", true) && len(identifiers) > 1 {
		allInterface, allModule := true, true
		classFamily, functionFamily, enumFamily := true, true, true
		for _, identifier := range identifiers {
			kind := identifier.Parent.Kind
			allInterface = allInterface && kind == ast.KindInterfaceDeclaration
			allModule = allModule && kind == ast.KindModuleDeclaration
			classFamily = classFamily && (kind == ast.KindClassDeclaration || kind == ast.KindInterfaceDeclaration || kind == ast.KindModuleDeclaration)
			functionFamily = functionFamily && (kind == ast.KindFunctionDeclaration || kind == ast.KindModuleDeclaration)
			enumFamily = enumFamily && (kind == ast.KindEnumDeclaration || kind == ast.KindModuleDeclaration)
		}
		if allInterface || allModule {
			return
		}
		var family ast.Kind
		if classFamily {
			family = ast.KindClassDeclaration
		} else if functionFamily {
			family = ast.KindFunctionDeclaration
		} else if enumFamily {
			family = ast.KindEnumDeclaration
		}
		if family != ast.KindUnknown {
			identifiers = slices.DeleteFunc(identifiers, func(identifier *ast.Node) bool { return identifier.Parent.Kind != family })
		}
	}
	builtin := false
	if rule.Boolean("builtinGlobals", true) && binding.Frame.Owner.Kind == ast.KindSourceFile && !ast.IsExternalModule(rule.Context.File) && rule.Context.GetChecker != nil {
		symbol := rule.Context.GetChecker().ResolveName(binding.Name, binding.Identifiers[0], ast.SymbolFlagsValue|ast.SymbolFlagsType, false)
		if symbol != nil {
			for _, declaration := range symbol.Declarations() {
				if !helpers.TsScopeContains(rule.Context.File.AsNode(), declaration) || ast.GetSourceFileOfNode(declaration) != rule.Context.File {
					builtin = true
				}
			}
		}
	}
	for index, identifier := range identifiers {
		if index == 0 && !builtin {
			continue
		}
		if builtin {
			rule.Context.Report(rule.Context.Range(identifier), diagnostics.X_0_is_already_defined_as_a_built_in_global_variable, binding.Name)
		} else {
			rule.Context.Report(rule.Context.Range(identifier), diagnostics.X_0_is_already_defined, binding.Name)
		}
	}
}

func newTypeScriptNoRedeclare(context Context) Rule {
	return &typescriptNoRedeclareRule{Context: context, Name: "no-redeclare"}
}
