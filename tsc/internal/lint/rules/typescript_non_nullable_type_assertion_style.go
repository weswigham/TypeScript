package rules

import (
	"slices"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/checker"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type typescriptNonNullableTypeAssertionStyleRule struct{ context Context }

func newTypeScriptNonNullableTypeAssertionStyle(context Context) Rule {
	rule := &typescriptNonNullableTypeAssertionStyleRule{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindAsExpression, ast.KindTypeAssertionExpression},
	}
}

func (rule *typescriptNonNullableTypeAssertionStyleRule) OnEnterNode(node *ast.Node) bool {
	if node.Kind != ast.KindAsExpression && node.Kind != ast.KindTypeAssertionExpression {
		return true
	}
	c := rule.context.GetChecker()
	original, asserted := c.GetTypeAtLocation(node.Expression()), c.GetTypeAtLocation(node.Type())
	if (original.Flags()|asserted.Flags())&(checker.TypeFlagsAny|checker.TypeFlagsUnknown) != 0 {
		return true
	}
	nonNull := make([]*checker.Type, 0)
	for _, part := range helpers.TypeSafetyUnionParts(original) {
		if part.Flags()&(checker.TypeFlagsNull|checker.TypeFlagsUndefined) == 0 {
			nonNull = append(nonNull, part)
		}
	}
	if len(nonNull) == len(helpers.TypeSafetyUnionParts(original)) {
		return true
	}
	assertedParts := helpers.TypeSafetyUnionParts(asserted)
	for _, part := range assertedParts {
		if typeSafetyAssertionCouldBeNullish(c, part) || !slices.Contains(nonNull, part) {
			return true
		}
	}
	for _, part := range nonNull {
		if !slices.Contains(assertedParts, part) {
			return true
		}
	}
	diagnostic := rule.context.Report(rule.context.Range(node), diagnostics.Use_a_assertion_to_more_succinctly_remove_null_and_undefined_from_the_type)
	if rule.context.NewTracker != nil {
		tracker := rule.context.NewTracker()
		tracker.ReplaceNode(rule.context.File, node, tracker.NewNonNullExpression(node.Expression(), ast.NodeFlagsNone), nil)
		diagnostic.SetCodeFixes(codefix.CreateCodeFixAction("@typescript-eslint/non-nullable-type-assertion-style", tracker.GetTextChanges(), ast.NewCompilerDiagnostic(diagnostics.Use_a_non_null_assertion), "@typescript-eslint/non-nullable-type-assertion-style", ast.NewCompilerDiagnostic(diagnostics.Use_non_null_assertions)))
	}
	return true
}

func typeSafetyAssertionCouldBeNullish(c *checker.Checker, typeValue *checker.Type) bool {
	if typeValue.Flags()&checker.TypeFlagsTypeParameter != 0 {
		constraint := c.GetConstraintOfTypeParameter(typeValue)
		return constraint == nil || typeSafetyAssertionCouldBeNullish(c, constraint)
	}
	if typeValue.Flags()&checker.TypeFlagsUnion != 0 {
		for _, part := range typeValue.Types() {
			if typeSafetyAssertionCouldBeNullish(c, part) {
				return true
			}
		}
		return false
	}
	return typeValue.Flags()&(checker.TypeFlagsNull|checker.TypeFlagsUndefined) != 0
}
