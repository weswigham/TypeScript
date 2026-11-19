package rules

import (
	"slices"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/checker"

	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type typescriptRestrictTemplateExpressionsRule struct{ context Context }

func newTypeScriptRestrictTemplateExpressions(context Context) Rule {
	rule := &typescriptRestrictTemplateExpressionsRule{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindTemplateExpression},
	}
}

func (rule *typescriptRestrictTemplateExpressionsRule) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindTemplateExpression && (node.Parent == nil || node.Parent.Kind != ast.KindTaggedTemplateExpression) {
		for _, span := range node.AsTemplateExpression().TemplateSpans.Nodes {
			expression := ast.SkipParentheses(span.Expression())
			value := helpers.SemanticConstrainedType(rule.context,

				rule.context.GetChecker().GetTypeAtLocation(expression))
			if !rule.templateAllowed(value) {
				rule.context.Report(rule.context.Range(expression), diagnostics.Invalid_type_0_of_template_literal_expression, rule.context.GetChecker().TypeToString(value))
			}
		}
	}
	return true
}

func (rule *typescriptRestrictTemplateExpressionsRule) templateAllowed(value *checker.Type) bool {
	if value.IsUnion() {
		for _, part := range value.Types() {
			if !rule.templateAllowed(part) {
				return false
			}
		}
		return true
	}
	if value.IsIntersection() {
		return slices.ContainsFunc(value.Types(), rule.templateAllowed)
	}
	if value.Flags()&checker.TypeFlagsStringLike != 0 {
		return true
	}
	defaults := []any{map[string]any{"name": []string{"Error", "URL", "URLSearchParams"}, "from": "lib"}}
	if helpers.SemanticMatchesBase(rule.context,

		value, func(part *checker.Type) bool {
			return helpers.SemanticAllowedType(rule.context,

				part, defaults)
		}, make(map[*checker.Type]bool)) {
		return true
	}
	for _, option := range []struct {
		name     string
		flags    checker.TypeFlags
		fallback bool
	}{
		{"allowAny", checker.TypeFlagsAny, true},
		{"allowBoolean", checker.TypeFlagsBooleanLike, true},
		{"allowNullish", checker.TypeFlagsNull | checker.TypeFlagsUndefined, true},
		{"allowNumber", checker.TypeFlagsNumberLike | checker.TypeFlagsBigIntLike, true},
		{"allowNever", checker.TypeFlagsNever, false},
	} {
		if helpers.SemanticBooleanOption(rule.context,

			option.name, option.fallback) && value.Flags()&option.flags != 0 {
			return true
		}
	}
	if helpers.SemanticBooleanOption(rule.context,

		"allowRegExp", true) && helpers.SemanticTypeName(rule.context,

		value) == "RegExp" {
		return true
	}
	if helpers.SemanticBooleanOption(rule.context,

		"allowArray", false) && (checker.IsTupleType(value) || rule.context.GetChecker().IsArrayType(value)) {
		element := rule.context.GetChecker().GetIndexTypeOfType(value, rule.context.GetChecker().GetNumberType())
		return element != nil && rule.templateAllowed(element)
	}
	return false
}
