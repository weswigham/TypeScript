package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type maxParamsRule struct {
	context Context
}

func (rule *maxParamsRule) OnEnterNode(node *ast.Node) bool {
	if !helpers.FunctionHasBody(node) && node.Kind != ast.KindFunctionType && node.Kind != ast.KindFunctionDeclaration {
		return true
	}
	parameters := node.Parameters()
	count := len(parameters)
	if count > 0 {
		first := parameters[0].AsParameterDeclaration()
		countThis := helpers.StringOptionValue(helpers.SyntaxObject(rule.context, 0)["countThis"], "except-void")
		if helpers.BooleanOptionValue(helpers.SyntaxObject(rule.context, 0), "countVoidThis", false) {
			countThis = "always"
		}
		if first.Name().Kind == ast.KindIdentifier && first.Name().Text() == "this" && (countThis == "never" || countThis == "except-void" && first.Type != nil && first.Type.Kind == ast.KindVoidKeyword) {
			count--
		}
	}
	if maximum := helpers.SyntaxMaximum(rule.context, 3); count > maximum {
		rule.context.Report(rule.context.Range(node), diagnostics.X_0_has_too_many_parameters_1_Maximum_allowed_is_2, helpers.CapitalizeFirstRune(helpers.FunctionDiagnosticName(node)), count, maximum)
	}
	return true
}

func (rule *maxParamsRule) OnExitNode(node *ast.Node) {
}

func newMaxParams(context Context) Rule {
	return &maxParamsRule{context: context}
}
