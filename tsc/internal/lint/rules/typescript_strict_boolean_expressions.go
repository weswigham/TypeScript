package rules

import (
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/checker"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type typescriptStrictBooleanExpressionsRule struct {
	context     Context
	suggestions map[*ast.Diagnostic][]*codefix.CodeFixAction
	checked     map[*ast.Node]bool
}

func newTypeScriptStrictBooleanExpressions(context Context) Rule {
	rule := &typescriptStrictBooleanExpressionsRule{context: context, checked: map[*ast.Node]bool{}}

	return Rule{
		Enter: rule.OnEnterNode,
		EnterKinds: []ast.Kind{
			ast.KindSourceFile,
			ast.KindIfStatement,
			ast.KindConditionalExpression,
			ast.KindWhileStatement,
			ast.KindDoStatement,
			ast.KindForStatement,
			ast.KindPrefixUnaryExpression,
			ast.KindBinaryExpression,
			ast.KindCallExpression,
		},
		GetSuggestions: rule.Suggestions,
	}
}

func (rule *typescriptStrictBooleanExpressionsRule) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindSourceFile {
		helpers.SemanticRequireStrictNullChecks(rule.context)
	}
	if test, _ := helpers.SemanticConditionTest(node); test != nil {
		rule.check(test, true)
	}
	if helpers.SemanticNegation(node) {
		rule.check(node.AsPrefixUnaryExpression().Operand, true)
	}
	if node.Kind == ast.KindBinaryExpression {
		operator := node.AsBinaryExpression().OperatorToken.Kind
		if operator == ast.KindAmpersandAmpersandToken || operator == ast.KindBarBarToken {
			rule.check(node, false)
		}
	}
	if node.Kind == ast.KindCallExpression {
		if argument, predicate := helpers.SemanticAssertionArgument(rule.context, node); argument != nil && predicate.Kind() == checker.TypePredicateKindAssertsIdentifier && predicate.Type() == nil {
			rule.check(argument, true)
		}
		if callback := helpers.SemanticPredicateCallback(rule.context, node); callback != nil {
			rule.callback(callback)
		}
	}
	return true
}

func (rule *typescriptStrictBooleanExpressionsRule) classify(values []*checker.Type) string {
	variants := map[string]bool{}
	booleanCount, trueBoolean := 0, false
	stringCount, truthyStrings, numberCount, truthyNumbers := 0, true, 0, true
	var inspect func(*checker.Type)
	inspect = func(value *checker.Type) {
		if value.IsUnion() {
			for _, part := range value.Types() {
				inspect(part)
			}
			return
		}
		flags := value.Flags()
		switch {
		case flags&(checker.TypeFlagsNull|checker.TypeFlagsUndefined|checker.TypeFlagsVoid) != 0:
			variants["nullish"] = true
		case flags&checker.TypeFlagsBooleanLike != 0:
			booleanCount++
			trueBoolean = helpers.SemanticTruthyLiteral(value)
		case flags&checker.TypeFlagsStringLike != 0:
			stringCount++
			truthyStrings = truthyStrings && flags&checker.TypeFlagsStringLiteral != 0 && helpers.SemanticTruthyLiteral(value)
		case flags&(checker.TypeFlagsNumberLike|checker.TypeFlagsBigIntLike) != 0:
			numberCount++
			truthyNumbers = truthyNumbers && flags&checker.TypeFlagsNumberLiteral != 0 && helpers.SemanticTruthyLiteral(value)
		case flags&(checker.TypeFlagsAny|checker.TypeFlagsUnknown|checker.TypeFlagsTypeParameter) != 0:
			variants["any"] = true
		case flags&checker.TypeFlagsNever != 0:
			variants["never"] = true
		default:
			if value.IsIntersection() && helpers.SemanticTypeFlags(value)&checker.TypeFlagsBooleanLike != 0 {
				variants["boolean"] = true
			} else {
				variants["object"] = true
			}
		}
		if flags&checker.TypeFlagsEnumLike != 0 {
			variants["enum"] = true
		}
	}
	seen := map[*checker.Type]bool{}
	for _, value := range values {
		for _, part := range helpers.SemanticUnionParts(value) {
			if !seen[part] {
				seen[part] = true
				inspect(part)
			}
		}
	}
	if booleanCount > 0 {
		if booleanCount == 1 && trueBoolean {
			variants["truthy boolean"] = true
		} else {
			variants["boolean"] = true
		}
	}
	if stringCount > 0 {
		if truthyStrings {
			variants["truthy string"] = true
		} else {
			variants["string"] = true
		}
	}
	if numberCount > 0 {
		if truthyNumbers {
			variants["truthy number"] = true
		} else {
			variants["number"] = true
		}
	}
	is := func(names ...string) bool {
		if len(variants) != len(names) {
			return false
		}
		for _, name := range names {
			if !variants[name] {
				return false
			}
		}
		return true
	}
	switch {
	case is("boolean"), is("truthy boolean"), is("never"), is("nullish", "truthy boolean"):
		return ""
	case is("nullish"):
		return "Nullish"
	case is("nullish", "boolean"):
		if !helpers.SemanticBooleanOption(rule.context, "allowNullableBoolean", false) {
			return "NullableBoolean"
		}
		return ""
	case helpers.SemanticBooleanOption(rule.context, "allowNumber", true) && is("nullish", "truthy number"), helpers.SemanticBooleanOption(rule.context, "allowString", true) && is("nullish", "truthy string"):
		return ""
	case is("string"), is("truthy string"):
		if !helpers.SemanticBooleanOption(rule.context, "allowString", true) {
			return "String"
		}
		return ""
	case is("number"), is("truthy number"):
		if !helpers.SemanticBooleanOption(rule.context, "allowNumber", true) {
			return "Number"
		}
		return ""
	case is("nullish", "string"):
		if !helpers.SemanticBooleanOption(rule.context, "allowNullableString", false) {
			return "NullableString"
		}
		return ""
	case is("nullish", "number"):
		if !helpers.SemanticBooleanOption(rule.context, "allowNullableNumber", false) {
			return "NullableNumber"
		}
		return ""
	case is("object"):
		return "Object"
	case is("nullish", "object"):
		if !helpers.SemanticBooleanOption(rule.context, "allowNullableObject", true) {
			return "NullableObject"
		}
		return ""
	case is("any"):
		if !helpers.SemanticBooleanOption(rule.context, "allowAny", false) {
			return "Any"
		}
		return ""
	}
	if variants["enum"] && variants["nullish"] {
		for name := range variants {
			if name != "enum" && name != "nullish" && name != "number" && name != "string" && name != "truthy number" && name != "truthy string" {
				return "Other"
			}
		}
		if !helpers.SemanticBooleanOption(rule.context, "allowNullableEnum", false) {
			return "NullableEnum"
		}
		return ""
	}
	return "Other"
}

var strictBooleanExpressionsMessages = map[string]*diagnostics.Message{
	"Any":             diagnostics.Unexpected_any_value_in_0_An_explicit_comparison_or_type_conversion_is_required,
	"NullableBoolean": diagnostics.Unexpected_nullable_boolean_value_in_0_Please_handle_the_nullish_case_explicitly,
	"NullableEnum":    diagnostics.Unexpected_nullable_enum_value_in_0_Please_handle_the_nullish_Slashzero_SlashNaN_cases_explicitly,
	"NullableNumber":  diagnostics.Unexpected_nullable_number_value_in_0_Please_handle_the_nullish_Slashzero_SlashNaN_cases_explicitly,
	"NullableObject":  diagnostics.Unexpected_nullable_object_value_in_0_An_explicit_null_check_is_required,
	"NullableString":  diagnostics.Unexpected_nullable_string_value_in_0_Please_handle_the_nullish_Slashempty_cases_explicitly,
	"Nullish":         diagnostics.Unexpected_nullish_value_in_conditional_The_condition_is_always_false,
	"Number":          diagnostics.Unexpected_number_value_in_0_An_explicit_zero_SlashNaN_check_is_required,
	"Object":          diagnostics.Unexpected_object_value_in_0_The_condition_is_always_true,
	"Other":           diagnostics.Unexpected_value_in_conditional_A_boolean_expression_is_required,
	"String":          diagnostics.Unexpected_string_value_in_0_An_explicit_empty_string_check_is_required,
}

func (rule *typescriptStrictBooleanExpressionsRule) conditionSuggestions(report *ast.Diagnostic, node *ast.Node, kind string) {
	text := helpers.SemanticWrappedExpression(rule.context, node)
	parent := helpers.SemanticExpressionParent(node)
	negated := helpers.SemanticNegation(parent)
	target := node
	if negated {
		target = parent
	}
	add := func(message *diagnostics.Message, replacement string, retainNegation bool) {
		replaceNode := target
		if retainNegation {
			replaceNode = node
		}
		replaceParent := helpers.SemanticExpressionParent(replaceNode)
		if replaceParent != nil && (replaceParent.Kind == ast.KindBinaryExpression || replaceParent.Kind == ast.KindConditionalExpression || helpers.SemanticNegation(replaceParent)) {
			replacement = "(" + replacement + ")"
		}
		rule.suggest(report, replaceNode, replacement, message)
	}
	cast := func() {
		prefix := ""
		if negated {
			prefix = "!"
		}
		add(diagnostics.Explicitly_convert_value_to_a_boolean_Boolean_value, prefix+"Boolean("+text+")", kind == "Any")
	}
	nullish := func() {
		operator := " != null"
		if negated {
			operator = " == null"
		}
		add(diagnostics.Change_condition_to_check_for_null_Slashundefined_value_null, text+operator, false)
	}
	switch kind {
	case "Any":
		cast()
	case "NullableBoolean":
		add(diagnostics.Explicitly_treat_nullish_value_the_same_as_false_value_false, text+" ?? false", true)
		if negated {
			add(diagnostics.Change_condition_to_check_if_false_value_false, text+" === false", false)
		} else {
			add(diagnostics.Change_condition_to_check_if_true_value_true, text+" === true", false)
		}
	case "NullableEnum", "NullableObject":
		nullish()
	case "NullableNumber", "NullableString":
		nullish()
		if kind == "NullableNumber" {
			add(diagnostics.Explicitly_treat_nullish_value_the_same_as_0_value_0, text+" ?? 0", true)
		} else {
			add(diagnostics.Explicitly_treat_nullish_value_the_same_as_an_empty_string_value, text+` ?? ""`, true)
		}
		cast()
	case "Number":
		if node.Kind == ast.KindPropertyAccessExpression && node.Name().Text() == "length" && helpers.SemanticArrayType(rule.context, helpers.SemanticTypeAtLocation(rule.context, node.Expression())) {
			if negated {
				add(diagnostics.Change_condition_to_check_array_s_length_value_length_0_24171, text+" === 0", false)
			} else {
				add(diagnostics.Change_condition_to_check_array_s_length_value_length_0, text+" > 0", false)
			}
			return
		}
		if negated {
			add(diagnostics.Change_condition_to_check_for_0_value_0, text+" === 0", false)
			add(diagnostics.Change_condition_to_check_for_NaN_Number_isNaN_value, "Number.isNaN("+text+")", false)
		} else {
			add(diagnostics.Change_condition_to_check_for_0_value_0, text+" !== 0", false)
			add(diagnostics.Change_condition_to_check_for_NaN_Number_isNaN_value, "!Number.isNaN("+text+")", false)
		}
		cast()
	case "String":
		if negated {
			add(diagnostics.Change_condition_to_check_string_s_length_value_length_0, text+".length === 0", false)
			add(diagnostics.Change_condition_to_check_for_empty_string_value, text+` === ""`, false)
		} else {
			add(diagnostics.Change_condition_to_check_string_s_length_value_length_0, text+".length > 0", false)
			add(diagnostics.Change_condition_to_check_for_empty_string_value, text+` !== ""`, false)
		}
		cast()
	}
}

func (rule *typescriptStrictBooleanExpressionsRule) check(node *ast.Node, condition bool) {
	node = ast.SkipParentheses(node)
	if rule.checked[node] {
		return
	}
	rule.checked[node] = true
	if node.Kind == ast.KindBinaryExpression {
		binary := node.AsBinaryExpression()
		if binary.OperatorToken.Kind == ast.KindAmpersandAmpersandToken || binary.OperatorToken.Kind == ast.KindBarBarToken {
			rule.check(binary.Left, true)
			rule.check(binary.Right, condition)
			return
		}
	}
	if !condition {
		return
	}
	kind := rule.classify([]*checker.Type{helpers.SemanticTypeAtLocation(rule.context, node)})
	if kind == "" {
		return
	}
	report := rule.context.Report(rule.context.Range(node), strictBooleanExpressionsMessages[kind], "conditional")
	rule.conditionSuggestions(report, node, kind)
}

func (rule *typescriptStrictBooleanExpressionsRule) callback(callback *ast.Node) {
	inline := callback.Kind == ast.KindArrowFunction || callback.Kind == ast.KindFunctionExpression
	if inline && ast.HasSyntacticModifier(callback, ast.ModifierFlagsAsync) {
		rule.context.Report(rule.context.Range(callback), diagnostics.Predicate_function_should_not_be_async_expected_a_boolean_return_type)
		return
	}
	var values []*checker.Type
	typeChecker := rule.context.GetChecker()
	for _, signature := range typeChecker.GetSignaturesOfType(helpers.SemanticTypeAtLocation(rule.context, callback), checker.SignatureKindCall) {
		value := typeChecker.GetReturnTypeOfSignature(signature)
		if constraint := typeChecker.GetBaseConstraintOfType(value); constraint != nil {
			value = constraint
		}
		values = append(values, value)
	}
	kind := rule.classify(values)
	if kind == "" {
		return
	}
	report := rule.context.Report(rule.context.Range(callback), strictBooleanExpressionsMessages[kind], "array predicate return type")
	if !inline {
		return
	}
	if callback.Body().Kind != ast.KindBlock {
		rule.conditionSuggestions(report, ast.SkipParentheses(callback.Body()), kind)
	}
	if callback.Type() != nil {
		return
	}
	start := scanner.GetTokenPosOfNode(callback, rule.context.File, false)
	end := scanner.GetTokenPosOfNode(callback.Body(), rule.context.File, false)
	prefix := rule.context.File.Text()[start:end]
	if callback.Kind == ast.KindArrowFunction {
		prefix = strings.TrimSpace(strings.TrimSuffix(strings.TrimSpace(prefix), "=>"))
	}
	if len(callback.Parameters()) == 1 && !strings.Contains(prefix, "(") {
		prefix = "(" + prefix + ")"
	}
	if closing := strings.LastIndex(prefix, ")"); closing >= 0 {
		prefix = prefix[:closing+1] + ": boolean" + prefix[closing+1:]
	}
	if callback.Kind == ast.KindArrowFunction {
		prefix += " => "
	} else {
		prefix += " "
	}
	rule.suggest(report, callback, prefix+helpers.SemanticSourceText(rule.context, callback.Body()), diagnostics.Add_an_explicit_boolean_return_type_annotation)
}

func (rule *typescriptStrictBooleanExpressionsRule) Suggestions() map[*ast.Diagnostic][]*codefix.CodeFixAction {
	return rule.suggestions
}

func (rule *typescriptStrictBooleanExpressionsRule) suggest(report *ast.Diagnostic, node *ast.Node, text string, message *diagnostics.Message, args ...any) {
	tracker := rule.context.NewTracker()
	tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(scanner.GetTokenPosOfNode(node, rule.context.File, false), node.End()), text)
	if rule.suggestions == nil {
		rule.suggestions = make(map[*ast.Diagnostic][]*codefix.CodeFixAction)
	}
	rule.suggestions[report] = append(rule.suggestions[report], codefix.CreateCodeFixAction("@typescript-eslint/strict-boolean-expressions", tracker.GetTextChanges(), ast.NewCompilerDiagnostic(message, args...), "", nil))
}
