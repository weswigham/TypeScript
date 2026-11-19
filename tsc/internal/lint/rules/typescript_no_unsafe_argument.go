package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/checker"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type typescriptNoUnsafeArgumentRule struct{ context Context }

func newTypeScriptNoUnsafeArgument(context Context) Rule {
	rule := &typescriptNoUnsafeArgumentRule{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindCallExpression, ast.KindNewExpression, ast.KindTaggedTemplateExpression},
	}
}

func (rule *typescriptNoUnsafeArgumentRule) OnEnterNode(node *ast.Node) bool {
	if node.Kind != ast.KindCallExpression && node.Kind != ast.KindNewExpression && node.Kind != ast.KindTaggedTemplateExpression {
		return true
	}
	typeChecker := rule.context.GetChecker()
	arguments := helpers.TypeSafetyArguments(node)
	if len(arguments) == 0 || helpers.TypeSafetyAny(typeChecker.GetTypeAtLocation(helpers.TypeSafetyCallee(node))) {
		return true
	}
	signature := helpers.TypeSafetyNewArgumentSignature(typeChecker, node)
	if node.Kind == ast.KindTaggedTemplateExpression {
		signature.Next()
	}
	for _, argument := range arguments {
		if argument.Kind == ast.KindSpreadElement {
			value := typeChecker.GetTypeAtLocation(argument.Expression())
			switch {
			case helpers.TypeSafetyAny(value):
				rule.context.Report(rule.context.Range(argument), diagnostics.Unsafe_spread_of_an_0_type, helpers.TypeSafetyDescribe(typeChecker, value))
			case helpers.TypeSafetyArray(typeChecker, value, checker.TypeFlagsAny):
				name := helpers.TypeSafetyDescribe(typeChecker, value)
				if helpers.TypeSafetyError(typeChecker.GetTypeArguments(value)[0]) {
					name = "error"
				}
				rule.context.Report(rule.context.Range(argument), diagnostics.Unsafe_spread_of_an_0_array_type, name)
			case checker.IsTupleType(value):
				for _, element := range typeChecker.GetTypeArguments(value) {
					receiver := signature.Next()
					if helpers.TypeSafetyAssignment(typeChecker, element, receiver, nil) {
						name := "of type " + helpers.TypeSafetyDescribe(typeChecker, element)
						if helpers.TypeSafetyError(element) {
							name = "error typed"
						}
						rule.context.Report(rule.context.Range(argument), diagnostics.Unsafe_spread_of_a_tuple_type_The_argument_is_0_and_is_assigned_to_a_parameter_of_type_1, name, helpers.TypeSafetyDescribe(typeChecker, receiver))
					}
				}
				if helpers.TypeSafetyVariableTuple(value) {
					signature.Consumed = true
				}
			}
			continue
		}
		receiver := signature.Next()
		sender := typeChecker.GetTypeAtLocation(argument)
		if helpers.TypeSafetyAssignment(typeChecker, sender, receiver, argument) {
			rule.context.Report(rule.context.Range(argument), diagnostics.Unsafe_argument_of_type_0_assigned_to_a_parameter_of_type_1, helpers.TypeSafetyDescribe(typeChecker, sender), helpers.TypeSafetyDescribe(typeChecker, receiver))
		}
	}
	return true
}
