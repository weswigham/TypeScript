package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type typescriptMaxParamsRule struct {
	context Context
}

func (rule *typescriptMaxParamsRule) OnEnterNode(node *ast.Node) bool {
	rule.parameters(node)
	return true
}

func (rule *typescriptMaxParamsRule) OnExitNode(node *ast.Node) {}

func (rule *typescriptMaxParamsRule) parameters(node *ast.Node) {
	if !helpers.TypescriptExecutableFunction(node) && node.Kind != ast.KindFunctionType {
		return
	}
	parameters := node.Parameters()

	count := len(parameters)
	if count > 0 && !rule.Boolean("countVoidThis", false) {
		first := parameters[0].AsParameterDeclaration()
		if first.Name().Kind == ast.KindIdentifier && first.Name().Text() == "this" && first.Type != nil && first.Type.Kind == ast.KindVoidKeyword {
			count--
		}
	}
	maximum := helpers.IntegerOptionValue(rule.Options()["max"], 3)
	if value := rule.Options()["maximum"]; value != nil {
		maximum = helpers.IntegerOptionValue(value, maximum)
	}
	if count > maximum {
		rule.context.Report(rule.context.Range(node), diagnostics.X_0_has_too_many_parameters_1_Maximum_allowed_is_2, helpers.CapitalizeFirstRune(helpers.FunctionDiagnosticName(node)), count, maximum)
	}
	return
}

func (rule *typescriptMaxParamsRule) Boolean(name string, fallback bool) bool {
	return helpers.BooleanOptionValue(rule.Options(), name, fallback)
}

func (rule *typescriptMaxParamsRule) Options() map[string]any {
	options, _ := rule.option(0).(map[string]any)
	return options
}

func (rule *typescriptMaxParamsRule) option(index int) any {
	if index < len(rule.context.Options) {
		return rule.context.Options[index]
	}
	return nil
}

func newTypeScriptMaxParams(context Context) Rule { return &typescriptMaxParamsRule{context: context} }
