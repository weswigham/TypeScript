package rules

import (
	"slices"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/checker"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type typescriptRequireArraySortCompareRule struct{ context Context }

func newTypeScriptRequireArraySortCompare(context Context) Rule {
	rule := &typescriptRequireArraySortCompareRule{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindCallExpression},
	}
}

func (rule *typescriptRequireArraySortCompareRule) OnEnterNode(node *ast.Node) bool {
	if node.Kind != ast.KindCallExpression || len(node.Arguments()) != 0 {
		return true
	}
	object, name := helpers.TypeSafetyMember(rule.context, node.Expression())
	if object == nil || name != "sort" && name != "toSorted" {
		return true
	}
	c := rule.context.GetChecker()
	value := helpers.TypeSafetyConstrained(c, c.GetTypeAtLocation(object))
	if helpers.TypeSafetyBool(rule.context, "ignoreStringArrays", true) && (c.IsArrayType(value) || checker.IsTupleType(value)) {
		stringsOnly := true
		for _, argument := range c.GetTypeArguments(value) {
			argument = helpers.TypeSafetyConstrained(c, argument)
			if !typeSafetyString(argument) {
				stringsOnly = false
				break
			}
		}
		if stringsOnly {
			return true
		}
	}
	for _, part := range helpers.TypeSafetyUnionParts(value) {
		if !c.IsArrayType(part) && !checker.IsTupleType(part) {
			return true
		}
	}
	rule.context.Report(rule.context.Range(node), diagnostics.Require_compare_argument)
	return true
}

func typeSafetyString(value *checker.Type) bool {
	if value.Flags()&checker.TypeFlagsStringLike != 0 {
		return true
	}
	if value.IsUnion() {
		for _, part := range value.Types() {
			if !typeSafetyString(part) {
				return false
			}
		}
		return true
	}
	if value.IsIntersection() {
		return slices.ContainsFunc(value.Types(), typeSafetyString)
	}
	return false
}
