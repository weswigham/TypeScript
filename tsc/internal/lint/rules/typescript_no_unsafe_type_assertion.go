package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/checker"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type typescriptNoUnsafeTypeAssertionRule struct{ context Context }

func (rule *typescriptNoUnsafeTypeAssertionRule) OnEnterNode(node *ast.Node) bool {
	if node.Kind != ast.KindAsExpression && node.Kind != ast.KindTypeAssertionExpression {
		return true
	}
	c := rule.context.GetChecker()
	sender, receiver := c.GetTypeAtLocation(node.Expression()), c.GetTypeAtLocation(node.Type())
	if sender == receiver {
		return true
	}
	if helpers.TypeSafetyAssertionAny(receiver) && sender.Flags()&checker.TypeFlagsUnknown != 0 {
		rule.context.Report(rule.context.Range(node), diagnostics.Unsafe_assertion_to_0_detected_Colon_consider_using_a_more_specific_type_to_ensure_safety, "`any`")
	} else if helpers.TypeSafetyAssertionUnsafe(c, sender, receiver, node.Expression()) {
		rule.context.Report(rule.context.Range(node), diagnostics.Unsafe_assertion_from_0_detected_Colon_consider_using_type_guards_or_a_safer_assertion, helpers.TypeSafetyAssertionAnyName(sender))
	} else if helpers.TypeSafetyAssertionUnsafe(c, receiver, sender, node.Type()) {
		rule.context.Report(rule.context.Range(node), diagnostics.Unsafe_assertion_to_0_detected_Colon_consider_using_a_more_specific_type_to_ensure_safety, helpers.TypeSafetyAssertionAnyName(receiver))
	} else {
		if sender.Flags()&checker.TypeFlagsObject != 0 && sender.ObjectFlags()&checker.ObjectFlagsObjectLiteral != 0 {
			sender = c.GetWidenedType(sender)
		}
		if c.IsTypeAssignableTo(sender, receiver) {
			return true
		}
		name := c.TypeToString(receiver)
		if receiver.Flags()&checker.TypeFlagsTypeParameter != 0 {
			constraint := c.GetBaseConstraintOfType(receiver)
			if constraint == nil {
				rule.context.Report(rule.context.Range(node), diagnostics.Unsafe_type_assertion_Colon_0_could_be_instantiated_with_an_arbitrary_type_which_could_be_unrelated_to_the_original_type, name)
				return true
			}
			if c.IsTypeAssignableTo(sender, constraint) {
				rule.context.Report(rule.context.Range(node), diagnostics.Unsafe_type_assertion_Colon_the_original_type_is_assignable_to_the_constraint_of_type_0_but_0_could_be_instantiated_with_a_different_subtype_of_its_constraint, name)
				return true
			}
		}
		rule.context.Report(rule.context.Range(node), diagnostics.Unsafe_type_assertion_Colon_type_0_is_more_narrow_than_the_original_type, name)
	}
	return true
}

func (rule *typescriptNoUnsafeTypeAssertionRule) OnExitNode(node *ast.Node) {}

func newTypeScriptNoUnsafeTypeAssertion(context Context) Rule {
	return &typescriptNoUnsafeTypeAssertionRule{context: context}
}
