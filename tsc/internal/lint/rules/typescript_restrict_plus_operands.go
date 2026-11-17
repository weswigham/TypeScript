package rules

import (
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/checker"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type typescriptRestrictPlusOperandsRule struct{ context Context }

func (rule *typescriptRestrictPlusOperandsRule) OnEnterNode(node *ast.Node) bool {
	if node.Kind != ast.KindBinaryExpression {
		return true
	}
	binary := node.AsBinaryExpression()
	if binary.OperatorToken.Kind != ast.KindPlusToken && (binary.OperatorToken.Kind != ast.KindPlusEqualsToken || helpers.TypeSafetyBool(rule.context, "skipCompoundAssignments", false)) {
		return true
	}
	c := rule.context.GetChecker()
	left := c.GetBaseTypeOfLiteralType(helpers.TypeSafetyConstrained(c, c.GetTypeAtLocation(binary.Left)))
	right := c.GetBaseTypeOfLiteralType(helpers.TypeSafetyConstrained(c, c.GetTypeAtLocation(binary.Right)))
	if left == right && left.Flags()&(checker.TypeFlagsBigIntLike|checker.TypeFlagsNumberLike|checker.TypeFlagsStringLike) != 0 {
		return true
	}
	var allowed []string
	for _, option := range []struct{ name, text string }{
		{"allowAny", "`any`"}, {"allowBoolean", "`boolean`"}, {"allowNullish", "`null`"}, {"allowRegExp", "`RegExp`"}, {"allowNullish", "`undefined`"},
	} {
		if helpers.TypeSafetyBool(rule.context, option.name, true) {
			allowed = append(allowed, option.text)
		}
	}
	stringLike := "string"
	if len(allowed) == 1 {
		stringLike += ", allowing a string + " + allowed[0]
	} else if len(allowed) > 1 {
		stringLike += ", allowing a string + any of: " + strings.Join(allowed, ", ")
	}
	complained := false
	for _, operand := range []struct {
		node         *ast.Node
		value, other *checker.Type
	}{{binary.Left, left, right}, {binary.Right, right, left}} {
		value := operand.value
		if helpers.TypeSafetyHasFlag(value, checker.TypeFlagsESSymbolLike|checker.TypeFlagsNever|checker.TypeFlagsUnknown) ||
			!helpers.TypeSafetyBool(rule.context, "allowAny", true) && helpers.TypeSafetyHasFlag(value, checker.TypeFlagsAny) ||
			!helpers.TypeSafetyBool(rule.context, "allowBoolean", true) && helpers.TypeSafetyHasFlag(value, checker.TypeFlagsBooleanLike) ||
			!helpers.TypeSafetyBool(rule.context, "allowNullish", true) && helpers.TypeSafetyHasFlag(value, checker.TypeFlagsNull|checker.TypeFlagsUndefined) {
			rule.context.Report(rule.context.Range(operand.node), diagnostics.Invalid_operand_for_a_operation_Operands_must_each_be_a_number_or_0_Got_1, stringLike, c.TypeToString(value))
			complained = true
			continue
		}
		for _, part := range helpers.TypeSafetyUnionParts(value) {
			invalid := false
			if c.TypeToString(part) == "RegExp" {
				invalid = !helpers.TypeSafetyBool(rule.context, "allowRegExp", true) || operand.other.Flags()&checker.TypeFlagsNumberLike != 0
			} else {
				invalid = !helpers.TypeSafetyBool(rule.context, "allowAny", true) && part.Flags()&checker.TypeFlagsAny != 0 || typeSafetyObjects(part)
			}
			if invalid {
				rule.context.Report(rule.context.Range(operand.node), diagnostics.Invalid_operand_for_a_operation_Operands_must_each_be_a_number_or_0_Got_1, stringLike, c.TypeToString(part))
				complained = true
			}
		}
	}
	if complained {
		return true
	}
	for _, operands := range [][2]*checker.Type{{left, right}, {right, left}} {
		if !helpers.TypeSafetyBool(rule.context, "allowNumberAndString", true) && helpers.TypeSafetyHasFlag(operands[0], checker.TypeFlagsStringLike) && helpers.TypeSafetyHasFlag(operands[1], checker.TypeFlagsNumberLike|checker.TypeFlagsBigIntLike) {
			rule.context.Report(rule.context.Range(node), diagnostics.Operands_of_operations_must_be_a_number_or_0_Got_1_2, stringLike, c.TypeToString(left), c.TypeToString(right))
			return true
		}
		if helpers.TypeSafetyHasFlag(operands[0], checker.TypeFlagsNumberLike) && helpers.TypeSafetyHasFlag(operands[1], checker.TypeFlagsBigIntLike) {
			rule.context.Report(rule.context.Range(node), diagnostics.Numeric_operations_must_either_be_both_bigints_or_both_numbers_Got_0_1, c.TypeToString(left), c.TypeToString(right))
			return true
		}
	}
	return true
}

func (rule *typescriptRestrictPlusOperandsRule) OnExitNode(node *ast.Node) {}

func typeSafetyObjects(value *checker.Type) bool {
	parts := helpers.TypeSafetyUnionParts(value)
	if value.IsIntersection() {
		parts = value.Types()
	}
	for _, part := range parts {
		if part.Flags()&checker.TypeFlagsObject == 0 {
			return false
		}
	}
	return true
}

func newTypeScriptRestrictPlusOperands(context Context) Rule {
	return &typescriptRestrictPlusOperandsRule{context: context}
}
