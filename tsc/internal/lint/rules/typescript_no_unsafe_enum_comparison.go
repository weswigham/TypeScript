package rules

import (
	"slices"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/checker"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type typescriptNoUnsafeEnumComparisonRule struct{ context Context }

func newTypeScriptNoUnsafeEnumComparison(context Context) Rule {
	rule := &typescriptNoUnsafeEnumComparisonRule{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindBinaryExpression, ast.KindCaseClause},
	}
}

func (rule *typescriptNoUnsafeEnumComparisonRule) OnEnterNode(node *ast.Node) bool {
	c := rule.context.GetChecker()
	if node.Kind == ast.KindBinaryExpression {
		binary := node.AsBinaryExpression()
		switch binary.OperatorToken.Kind {
		case ast.KindEqualsEqualsToken, ast.KindEqualsEqualsEqualsToken, ast.KindExclamationEqualsToken, ast.KindExclamationEqualsEqualsToken, ast.KindLessThanToken, ast.KindLessThanEqualsToken, ast.KindGreaterThanToken, ast.KindGreaterThanEqualsToken:
			if typeSafetyAssertionEnumMismatch(c, c.GetTypeAtLocation(binary.Left), c.GetTypeAtLocation(binary.Right)) {
				rule.context.Report(rule.context.Range(node), diagnostics.The_two_values_in_this_comparison_do_not_have_a_shared_enum_type)
			}
		}
	} else if node.Kind == ast.KindCaseClause {
		switchNode := node.Parent.Parent
		if switchNode.Kind == ast.KindSwitchStatement && typeSafetyAssertionEnumMismatch(c, c.GetTypeAtLocation(switchNode.Expression()), c.GetTypeAtLocation(node.Expression())) {
			rule.context.Report(rule.context.Range(node), diagnostics.The_case_statement_does_not_have_a_shared_enum_type_with_the_switch_predicate)
		}
	}
	return true
}

func typeSafetyAssertionEnumMismatch(c *checker.Checker, left, right *checker.Type) bool {
	leftEnums, rightEnums := typeSafetyAssertionEnumTypes(c, left), typeSafetyAssertionEnumTypes(c, right)
	if len(leftEnums) == 0 && len(rightEnums) == 0 {
		return false
	}
	for _, enumType := range leftEnums {
		if slices.Contains(rightEnums, enumType) {
			return false
		}
	}
	for _, part := range helpers.TypeSafetyUnionParts(left) {
		if slices.Contains(helpers.TypeSafetyUnionParts(right), part) {
			return false
		}
	}
	violates := func(enumSide, other *checker.Type) bool {
		for _, part := range helpers.TypeSafetyUnionParts(enumSide) {
			if part.Flags()&checker.TypeFlagsEnumLike == 0 {
				continue
			}
			flags := checker.TypeFlagsStringLike
			if part.Flags()&checker.TypeFlagsNumberLiteral != 0 {
				flags = checker.TypeFlagsNumberLike
			}
			if helpers.TypeSafetyAssertionFlags(other)&flags != 0 {
				return true
			}
		}
		return false
	}
	return violates(left, right) || violates(right, left)
}

func typeSafetyAssertionEnumTypes(c *checker.Checker, typeValue *checker.Type) []*checker.Type {
	var result []*checker.Type
	for _, part := range helpers.TypeSafetyUnionParts(typeValue) {
		if part.Flags()&checker.TypeFlagsEnumLiteral == 0 {
			continue
		}
		base := part
		if symbol := part.Symbol(); symbol != nil && symbol.Flags()&ast.SymbolFlagsEnumMember != 0 {
			base = c.GetTypeAtLocation(symbol.ValueDeclaration().Parent)
		}
		result = append(result, base)
	}
	return result
}
