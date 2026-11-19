package rules

import (
	"slices"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/checker"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type typeScriptNoMisusedSpread struct {
	context     Context
	suggestions map[*ast.Diagnostic][]*codefix.CodeFixAction
}

func newTypeScriptNoMisusedSpread(context Context) Rule {
	rule := &typeScriptNoMisusedSpread{context: context}

	return Rule{
		Enter:          rule.OnEnterNode,
		EnterKinds:     []ast.Kind{ast.KindSpreadAssignment, ast.KindJsxSpreadAttribute, ast.KindSpreadElement},
		GetSuggestions: rule.Suggestions,
	}
}

func (rule *typeScriptNoMisusedSpread) OnEnterNode(node *ast.Node) bool {
	rule.spread(node)
	return true
}

func (rule *typeScriptNoMisusedSpread) Suggestions() map[*ast.Diagnostic][]*codefix.CodeFixAction {
	return rule.suggestions
}

func (rule *typeScriptNoMisusedSpread) constrained(node *ast.Node) *checker.Type {
	typeChecker := rule.context.GetChecker()
	value := typeChecker.GetTypeAtLocation(node)
	if constraint := typeChecker.GetBaseConstraintOfType(value); constraint != nil {
		return constraint
	}
	return value
}

func typeScriptNoMisusedSpreadSome(value *checker.Type, predicate func(*checker.Type) bool) bool {
	if value == nil {
		return false
	}
	if value.Flags()&checker.TypeFlagsUnionOrIntersection != 0 {
		for _, part := range value.Types() {
			if typeScriptNoMisusedSpreadSome(part, predicate) {
				return true
			}
		}
		return false
	}
	return predicate(value)
}

func (rule *typeScriptNoMisusedSpread) spread(node *ast.Node) {
	object := node.Kind == ast.KindSpreadAssignment || node.Kind == ast.KindJsxSpreadAttribute
	if !object && (node.Kind != ast.KindSpreadElement || node.Parent.Kind != ast.KindArrayLiteralExpression && node.Parent.Kind != ast.KindCallExpression) {
		return
	}
	argument := node.Expression()
	value := rule.constrained(argument)
	if helpers.SemanticTypeAllowed(rule.context, value, nil, false) {
		return
	}
	stringLike := typeScriptNoMisusedSpreadSome(value, func(part *checker.Type) bool { return part.Flags()&checker.TypeFlagsStringLike != 0 })
	if !object {
		if stringLike {
			rule.context.Report(rule.context.Range(node), diagnostics.Using_the_spread_operator_on_a_string_can_mishandle_special_characters_as_can_split_produces_Unicode_code_points_which_will_decompose_complex_emojis_into_individual_emojis_split_produces_UTF_16_code_units_which_breaks_rich_characters_in_many_languages_Consider_using_Intl_Segmenter_for_locale_aware_string_decomposition_Otherwise_if_you_don_t_need_to_preserve_emojis_or_other_non_Ascii_characters_disable_this_lint_rule_on_this_line_or_configure_the_allow_rule_option)
		}
		return
	}
	typeChecker := rule.context.GetChecker()
	var message, suggestion *diagnostics.Message
	mapLike := false
	switch {
	case typeScriptNoMisusedSpreadSome(value, func(part *checker.Type) bool { return rule.builtin(part, "Promise") }):
		message, suggestion = diagnostics.Using_the_spread_operator_on_Promise_in_an_object_can_cause_unexpected_behavior_Did_you_forget_to_await_the_promise, diagnostics.Add_await_operator
	case typeScriptNoMisusedSpreadSome(value, func(part *checker.Type) bool {
		return len(typeChecker.GetSignaturesOfType(part, checker.SignatureKindCall)) > 0 && len(typeChecker.GetPropertiesOfType(part)) == 0
	}):
		message = diagnostics.Using_the_spread_operator_on_a_function_without_additional_properties_can_cause_unexpected_behavior_Did_you_forget_to_call_the_function
	case typeScriptNoMisusedSpreadSome(value, func(part *checker.Type) bool { return rule.builtin(part, "Map", "ReadonlyMap", "WeakMap") }):
		message = diagnostics.Using_the_spread_operator_on_a_Map_in_an_object_will_result_in_an_empty_object_Did_you_mean_to_use_Object_fromEntries_map_instead
		mapLike = true
		iterableMap := true
		parts := []*checker.Type{value}
		if value.IsUnion() {
			parts = value.Types()
		}
		for _, part := range parts {
			if !typeScriptNoMisusedSpreadSome(part, func(child *checker.Type) bool { return rule.builtin(child, "Map", "ReadonlyMap") }) {
				iterableMap = false
			}
		}
		if iterableMap {
			suggestion = diagnostics.Replace_map_spread_in_object_with_Object_fromEntries
		}
	case typeScriptNoMisusedSpreadSome(value, func(part *checker.Type) bool { return typeChecker.IsArrayType(part) || checker.IsTupleType(part) }):
		message = diagnostics.Using_the_spread_operator_on_an_array_in_an_object_will_result_in_a_list_of_indices
	case rule.iterable(value) && !stringLike:
		message = diagnostics.Using_the_spread_operator_on_an_Iterable_in_an_object_can_cause_unexpected_behavior
	case typeScriptNoMisusedSpreadSome(value, func(part *checker.Type) bool {
		if len(typeChecker.GetSignaturesOfType(part, checker.SignatureKindConstruct)) > 0 {
			return false
		}
		if symbol := part.Symbol(); symbol != nil {
			for _, declaration := range symbol.Declarations() {
				if len(typeChecker.GetSignaturesOfType(typeChecker.GetTypeOfSymbolAtLocation(symbol, declaration), checker.SignatureKindConstruct)) > 0 {
					return true
				}
			}
		}
		return false
	}):
		message = diagnostics.Using_the_spread_operator_on_class_instances_will_lose_their_class_prototype
	case typeScriptNoMisusedSpreadSome(value, func(part *checker.Type) bool {
		if part.Flags()&checker.TypeFlagsObject != 0 && part.ObjectFlags()&checker.ObjectFlagsInstantiationExpressionType != 0 {
			return true
		}
		if symbol := part.Symbol(); symbol != nil && symbol.ValueDeclaration() != nil {
			return ast.IsClassLike(symbol.ValueDeclaration())
		}
		return false
	}):
		message = diagnostics.Using_the_spread_operator_on_class_declarations_will_spread_only_their_static_properties_and_will_lose_their_class_prototype
	}
	if message == nil {
		return
	}
	report := rule.context.Report(rule.context.Range(node), message)
	if suggestion == nil || rule.context.NewTracker == nil {
		return
	}
	tracker := rule.context.NewTracker()
	if mapLike {
		target := argument
		if node.Kind == ast.KindSpreadAssignment && len(node.Parent.AsObjectLiteralExpression().Properties.Nodes) == 1 {
			target = node.Parent
		}
		tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(helpers.SemanticTypeStart(rule.context, target), target.End()), "Object.fromEntries("+helpers.SemanticTypeText(rule.context, argument)+")")
	} else {
		text := helpers.SemanticTypeText(rule.context, argument)
		if ast.GetExpressionPrecedence(argument) <= ast.OperatorPrecedenceUnary {
			text = "(" + text + ")"
		}
		tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(helpers.SemanticTypeStart(rule.context, argument), argument.End()), "await "+text)
	}
	if rule.suggestions == nil {
		rule.suggestions = make(map[*ast.Diagnostic][]*codefix.CodeFixAction)
	}
	description := ast.NewCompilerDiagnostic(suggestion)
	rule.suggestions[report] = []*codefix.CodeFixAction{codefix.CreateCodeFixAction("@typescript-eslint/"+"no-misused-spread", tracker.GetTextChanges(), description, "", nil)}
}

func (rule *typeScriptNoMisusedSpread) builtin(value *checker.Type, names ...string) bool {
	seen := make(map[*checker.Type]bool)
	var visit func(*checker.Type) bool
	visit = func(part *checker.Type) bool {
		if part == nil || seen[part] {
			return false
		}
		seen[part] = true
		defer delete(seen, part)
		if part.IsUnion() {
			for _, child := range part.Types() {
				if !visit(child) {
					return false
				}
			}
			return true
		}
		if part.IsIntersection() {
			return slices.ContainsFunc(part.Types(), visit)
		}
		typeChecker := rule.context.GetChecker()
		if part.Flags()&checker.TypeFlagsTypeParameter != 0 {
			return visit(typeChecker.GetBaseConstraintOfType(part))
		}
		symbol := part.Symbol()
		if symbol == nil {
			return false
		}
		if slices.Contains(names, symbol.Name()) && typeChecker.IsLibSymbolForHoverVerbosity(symbol) {
			return true
		}
		if symbol.Flags()&(ast.SymbolFlagsClass|ast.SymbolFlagsInterface) != 0 {
			return slices.ContainsFunc(typeChecker.GetBaseTypes(typeChecker.GetDeclaredTypeOfSymbol(symbol)), visit)
		}
		return false
	}
	return visit(value)
}

func (rule *typeScriptNoMisusedSpread) iterable(value *checker.Type) bool {
	typeChecker := rule.context.GetChecker()
	symbol := typeChecker.GetGlobalSymbol("Symbol", ast.SymbolFlagsValue, nil)
	name := ast.InternalSymbolNamePrefix + "@iterator"
	if symbol != nil {
		if iterator := typeChecker.GetTypeOfPropertyOfType(typeChecker.GetTypeOfSymbol(symbol), "iterator"); iterator != nil && checker.IsTypeUsableAsPropertyName(iterator) {
			name = checker.GetPropertyNameFromType(iterator)
		}
	}
	return typeScriptNoMisusedSpreadSome(value, func(part *checker.Type) bool { return typeChecker.GetPropertyOfType(part, name) != nil })
}
