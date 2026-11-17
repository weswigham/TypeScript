package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/checker"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type typescriptNoUnsafeCallRule struct{ context Context }

func (rule *typescriptNoUnsafeCallRule) OnEnterNode(node *ast.Node) bool {
	if node.Kind != ast.KindCallExpression && node.Kind != ast.KindNewExpression && node.Kind != ast.KindTaggedTemplateExpression {
		return true
	}
	typeChecker := rule.context.GetChecker()
	callee := helpers.TypeSafetyCallee(node)
	if callee.Kind == ast.KindImportKeyword {
		return true
	}
	value := helpers.TypeSafetyConstrain(typeChecker, typeChecker.GetTypeAtLocation(callee))
	reportingNode := callee
	message, errorMessage := diagnostics.Unsafe_call_of_0_typed_value, diagnostics.Unsafe_call_of_a_type_that_could_not_be_resolved
	if node.Kind == ast.KindNewExpression {
		reportingNode = node
		message, errorMessage = diagnostics.Unsafe_construction_of_0_typed_value, diagnostics.Unsafe_construction_of_a_type_that_could_not_be_resolved
	} else if node.Kind == ast.KindTaggedTemplateExpression {
		message, errorMessage = diagnostics.Unsafe_use_of_0_typed_template_tag, diagnostics.Unsafe_use_of_a_template_tag_whose_type_could_not_be_resolved
	}
	if helpers.TypeSafetyAny(value) {
		if helpers.TypeSafetyImplicitThis(rule.context, callee) {
			message = diagnostics.Unsafe_call_of_0_typed_value_this_is_typed_as_0_You_can_try_to_fix_this_by_turning_on_the_noImplicitThis_compiler_option_or_adding_a_this_parameter_to_the_function
			errorMessage = diagnostics.Unsafe_call_of_a_this_type_that_could_not_be_resolved
		}
		if helpers.TypeSafetyError(value) {
			rule.context.Report(rule.context.Range(reportingNode), errorMessage)
		} else {
			rule.context.Report(rule.context.Range(reportingNode), message, "an `any`")
		}
		return true
	}
	if !typeSafetyBuiltinFunction(typeChecker, value, make(map[*checker.Type]bool)) {
		return true
	}
	if len(typeChecker.GetSignaturesOfType(value, checker.SignatureKindConstruct)) != 0 {
		return true
	}
	calls := typeChecker.GetSignaturesOfType(value, checker.SignatureKindCall)
	if node.Kind != ast.KindNewExpression && len(calls) != 0 {
		return true
	}
	if node.Kind == ast.KindNewExpression {
		for _, signature := range calls {
			if typeChecker.GetReturnTypeOfSignature(signature).Flags()&checker.TypeFlagsVoid == 0 {
				return true
			}
		}
	}
	rule.context.Report(rule.context.Range(reportingNode), message, "a `Function`")
	return true
}

func (rule *typescriptNoUnsafeCallRule) OnExitNode(node *ast.Node) {}

func typeSafetyBuiltinFunction(typeChecker *checker.Checker, value *checker.Type, visited map[*checker.Type]bool) bool {
	if value == nil || visited[value] {
		return false
	}
	visited[value] = true
	if value.IsUnion() {
		for _, part := range value.Types() {
			if !typeSafetyBuiltinFunction(typeChecker, part, visited) {
				return false
			}
		}
		return true
	}
	if value.IsIntersection() {
		for _, part := range value.Types() {
			if typeSafetyBuiltinFunction(typeChecker, part, visited) {
				return true
			}
		}
		return false
	}
	if symbol := value.Symbol(); symbol != nil && symbol.Name() == "Function" && typeChecker.IsLibSymbolForHoverVerbosity(symbol) {
		return true
	}
	if value.ObjectFlags()&checker.ObjectFlagsClassOrInterface != 0 {
		for _, base := range typeChecker.GetBaseTypes(value) {
			if typeSafetyBuiltinFunction(typeChecker, base, visited) {
				return true
			}
		}
	}
	return false
}

func newTypeScriptNoUnsafeCall(context Context) Rule {
	return &typescriptNoUnsafeCallRule{context: context}
}
