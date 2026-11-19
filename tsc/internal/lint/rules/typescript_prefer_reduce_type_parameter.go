package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/checker"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type typescriptPreferReduceTypeParameterRule struct {
	context Context
	helpers.DiagnosticSuggestions
}

func newTypeScriptPreferReduceTypeParameter(context Context) Rule {
	rule := &typescriptPreferReduceTypeParameterRule{context: context}

	return Rule{
		Enter:          rule.OnEnterNode,
		EnterKinds:     []ast.Kind{ast.KindCallExpression},
		GetSuggestions: rule.Suggestions,
	}
}

func (rule *typescriptPreferReduceTypeParameterRule) OnEnterNode(node *ast.Node) bool {
	if node.Kind != ast.KindCallExpression || len(node.Arguments()) < 2 {
		return true
	}
	object, name := helpers.TypeSafetyMember(rule.context, node.Expression())
	if object == nil || name != "reduce" {
		return true
	}
	argument := node.Arguments()[1]
	if argument.Kind != ast.KindAsExpression && argument.Kind != ast.KindTypeAssertionExpression {
		return true
	}
	c := rule.context.GetChecker()
	if !c.IsTypeAssignableTo(c.GetTypeAtLocation(argument.Expression()), c.GetTypeFromTypeNode(argument.Type())) || !typeSafetyArrayConstituents(c, helpers.TypeSafetyConstrained(c, c.GetTypeAtLocation(object))) {
		return true
	}
	diagnostic := rule.context.Report(rule.context.Range(argument), diagnostics.Unnecessary_assertion_Colon_Array_reduce_accepts_a_type_parameter_for_the_default_value)
	if rule.context.NewTracker != nil {
		tracker := rule.context.NewTracker()
		tracker.ReplaceNode(rule.context.File, argument, argument.Expression(), nil)
		if len(node.TypeArguments()) == 0 {
			annotation := argument.Type()
			text := rule.context.File.Text()[scanner.GetTokenPosOfNode(annotation, rule.context.File, false):annotation.End()]
			tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(node.Expression().End(), node.Expression().End()), "<"+text+">")
		}
		rule.AddSuggestion(diagnostic, "@typescript-eslint/prefer-reduce-type-parameter", tracker.GetTextChanges(), ast.NewCompilerDiagnostic(diagnostics.Use_a_type_parameter_instead_of_an_assertion))
	}
	return true
}

func typeSafetyArrayConstituents(c *checker.Checker, value *checker.Type) bool {
	if value.Flags()&checker.TypeFlagsUnionOrIntersection != 0 {
		for _, part := range value.Types() {
			if !typeSafetyArrayConstituents(c, part) {
				return false
			}
		}
		return true
	}
	return c.IsArrayType(value) || checker.IsTupleType(value)
}
