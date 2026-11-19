package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/checker"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type typescriptNoUnsafeReturnRule struct{ context Context }

func newTypeScriptNoUnsafeReturn(context Context) Rule {
	rule := &typescriptNoUnsafeReturnRule{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindReturnStatement, ast.KindArrowFunction},
	}
}

func (rule *typescriptNoUnsafeReturnRule) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindReturnStatement && node.Expression() != nil {
		rule.check(node.Expression(), node)
	}
	if node.Kind == ast.KindArrowFunction && node.Body().Kind != ast.KindBlock {
		rule.check(node.Body(), node.Body())
	}
	return true
}

func (rule *typescriptNoUnsafeReturnRule) check(expression, reportingNode *ast.Node) {
	function := helpers.TypeSafetyParentFunction(expression)
	if function == nil {
		return
	}
	typeChecker := rule.context.GetChecker()
	sender := typeChecker.GetTypeAtLocation(expression)
	kind := typeSafetyDiscriminate(typeChecker, sender, make(map[*checker.Type]bool))
	functionType := typeChecker.GetTypeAtLocation(function)
	if function.Kind == ast.KindArrowFunction || function.Kind == ast.KindFunctionExpression {
		if contextual := typeChecker.GetContextualType(function, checker.ContextFlagsNone); contextual != nil {
			functionType = contextual
		}
	}
	signatures := typeSafetyCallSignatures(typeChecker, functionType)
	async := ast.IsAsyncFunction(function)
	if function.Type() != nil {
		for _, signature := range signatures {
			receiver := typeChecker.GetReturnTypeOfSignature(signature)
			if receiver == sender || receiver.Flags()&(checker.TypeFlagsAny|checker.TypeFlagsUnknown) != 0 {
				return
			}
			if async {
				awaitedReceiver, awaitedSender := typeChecker.GetAwaitedType(receiver), typeChecker.GetAwaitedType(sender)
				if awaitedReceiver == awaitedSender || awaitedReceiver != nil && awaitedReceiver.Flags()&(checker.TypeFlagsAny|checker.TypeFlagsUnknown) != 0 {
					return
				}
			}
		}
	}
	if kind != 0 {
		for _, signature := range signatures {
			receiver := typeChecker.GetReturnTypeOfSignature(signature)
			if kind == 1 && helpers.TypeSafetyUnknown(receiver) || kind == 2 && helpers.TypeSafetyArray(typeChecker, receiver, checker.TypeFlagsUnknown) {
				return
			}
			if kind == 3 && helpers.TypeSafetyUnknown(typeChecker.GetAwaitedType(receiver)) {
				return
			}
		}
		if kind == 3 && !async {
			return
		}
		name := "`any`"
		if kind == 2 {
			name = "`any[]`"
		} else if kind == 3 {
			name = "`Promise<any>`"
		}
		if helpers.TypeSafetyError(helpers.TypeSafetyConstrain(typeChecker, sender)) {
			name = "error"
		}
		message := diagnostics.Unsafe_return_of_a_value_of_type_0
		if helpers.TypeSafetyImplicitThis(rule.context, expression) {
			message = diagnostics.Unsafe_return_of_a_value_of_type_0_this_is_typed_as_any_You_can_try_to_fix_this_by_turning_on_the_noImplicitThis_compiler_option_or_adding_a_this_parameter_to_the_function
		}
		rule.context.Report(rule.context.Range(reportingNode), message, name)
		return
	}
	if len(signatures) != 0 {
		receiver := typeChecker.GetReturnTypeOfSignature(signatures[0])
		if helpers.TypeSafetyAssignment(typeChecker, sender, receiver, expression) {
			rule.context.Report(rule.context.Range(reportingNode), diagnostics.Unsafe_return_of_type_0_from_function_with_return_type_1, typeChecker.TypeToString(sender), typeChecker.TypeToString(receiver))
		}
	}
}

func typeSafetyCallSignatures(typeChecker *checker.Checker, value *checker.Type) []*checker.Signature {
	if value.IsUnion() {
		var signatures []*checker.Signature
		for _, part := range value.Types() {
			signatures = append(signatures, typeSafetyCallSignatures(typeChecker, part)...)
		}
		return signatures
	}
	return typeChecker.GetSignaturesOfType(value, checker.SignatureKindCall)
}

func typeSafetyDiscriminate(typeChecker *checker.Checker, value *checker.Type, visited map[*checker.Type]bool) int {
	if value == nil || visited[value] {
		return 0
	}
	visited[value] = true
	if helpers.TypeSafetyAny(value) {
		return 1
	}
	if helpers.TypeSafetyArray(typeChecker, value, checker.TypeFlagsAny) {
		return 2
	}
	parts := []*checker.Type{value}
	if value.IsUnion() {
		parts = value.Types()
	}
	for _, part := range parts {
		awaited := typeChecker.GetAwaitedType(part)
		if awaited != nil && awaited != part && typeSafetyDiscriminate(typeChecker, awaited, visited) == 1 {
			return 3
		}
	}
	return 0
}
