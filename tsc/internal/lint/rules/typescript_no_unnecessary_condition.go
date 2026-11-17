package rules

import (
	"cmp"
	"strconv"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/checker"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/jsnum"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type typescriptNoUnnecessaryConditionRule struct {
	context     Context
	suggestions map[*ast.Diagnostic][]*codefix.CodeFixAction
}

func (rule *typescriptNoUnnecessaryConditionRule) arrayIndex(node *ast.Node) bool {
	node = ast.SkipParentheses(node)
	if node.Kind != ast.KindElementAccessExpression {
		return false
	}
	for _, part := range helpers.SemanticUnionParts(helpers.SemanticTypeAtLocation(rule.context, node.Expression())) {
		if rule.context.GetChecker().IsArrayType(part) {
			return true
		}
		if checker.IsTupleType(part) {
			index := ast.SkipParentheses(node.AsElementAccessExpression().ArgumentExpression)
			if index.Kind != ast.KindNumericLiteral && index.Kind != ast.KindStringLiteral {
				return true
			}
		}
	}
	return false
}

func (rule *typescriptNoUnnecessaryConditionRule) unchecked() bool {
	return rule.context.CompilerOptions != nil && rule.context.CompilerOptions.NoUncheckedIndexedAccess.IsTrue()
}

func (rule *typescriptNoUnnecessaryConditionRule) arrayChain(node *ast.Node) bool {
	node = ast.SkipParentheses(node)
	for node.Kind == ast.KindPropertyAccessExpression || node.Kind == ast.KindElementAccessExpression || node.Kind == ast.KindCallExpression {
		if node.QuestionDotToken() != nil && rule.arrayIndex(node.Expression()) {
			return true
		}
		if node.Expression().Kind == ast.KindParenthesizedExpression {
			return false
		}
		node = node.Expression()
	}
	return false
}

func (rule *typescriptNoUnnecessaryConditionRule) check(expression *ast.Node) {
	if expression == nil {
		return
	}
	node := ast.SkipParentheses(expression)
	negated := false
	for helpers.SemanticNegation(node) {
		negated = !negated
		node = ast.SkipParentheses(node.AsPrefixUnaryExpression().Operand)
	}
	if !rule.unchecked() && rule.arrayIndex(node) {
		return
	}
	if node.Kind == ast.KindBinaryExpression {
		binary := node.AsBinaryExpression()
		if binary.OperatorToken.Kind == ast.KindAmpersandAmpersandToken || binary.OperatorToken.Kind == ast.KindBarBarToken {
			if helpers.SemanticOnlyTruthiness(node) {
				rule.check(binary.Right)
			}
			return
		}
	}
	value := helpers.SemanticTypeAtLocation(rule.context, node)
	if helpers.SemanticUncertainType(value) {
		return
	}
	truthy, falsy := helpers.SemanticTruthiness(value)
	var message *diagnostics.Message
	if value.Flags()&checker.TypeFlagsNever != 0 {
		message = diagnostics.Unnecessary_conditional_value_is_never
	} else if !truthy {
		if negated {
			message = diagnostics.Unnecessary_conditional_value_is_always_truthy
		} else {
			message = diagnostics.Unnecessary_conditional_value_is_always_falsy
		}
	} else if !falsy {
		if negated {
			message = diagnostics.Unnecessary_conditional_value_is_always_falsy
		} else {
			message = diagnostics.Unnecessary_conditional_value_is_always_truthy
		}
	}
	if message != nil {
		rule.context.Report(rule.context.Range(ast.SkipParentheses(expression)), message)
	}
}

func (rule *typescriptNoUnnecessaryConditionRule) memberNullable(node *ast.Node) bool {
	node = ast.SkipParentheses(node)
	if node.Kind == ast.KindPropertyAccessExpression {
		object := rule.context.GetChecker().GetNonNullableType(helpers.SemanticTypeAtLocation(rule.context, node.Expression()))
		property := rule.context.GetChecker().GetPropertyOfType(object, node.Name().Text())
		return property != nil && property.Flags()&ast.SymbolFlagsOptional != 0
	}
	if node.Kind == ast.KindElementAccessExpression {
		object := rule.context.GetChecker().GetNonNullableType(helpers.SemanticTypeAtLocation(rule.context, node.Expression()))
		for _, key := range helpers.SemanticUnionParts(helpers.SemanticTypeAtLocation(rule.context, node.AsElementAccessExpression().ArgumentExpression)) {
			if literal, ok := helpers.SemanticLiteralValue(key); ok {
				name := noUnnecessaryConditionValueString(literal)
				if property := rule.context.GetChecker().GetPropertyOfType(object, name); property != nil && property.Flags()&ast.SymbolFlagsOptional != 0 {
					return true
				}
				if value := rule.context.GetChecker().GetTypeOfPropertyOfType(object, name); value != nil && helpers.SemanticNullishType(value, true) {
					return true
				}
			} else if len(rule.context.GetChecker().GetIndexInfosOfType(object)) != 0 {
				return true
			}
		}
	}
	return false
}

func (rule *typescriptNoUnnecessaryConditionRule) nullish(node *ast.Node) {
	value := helpers.SemanticTypeAtLocation(rule.context, node)
	if helpers.SemanticUncertainType(value) {
		return
	}
	if value.Flags()&checker.TypeFlagsNever != 0 {
		rule.context.Report(rule.context.Range(node), diagnostics.Unnecessary_conditional_value_is_never)
		return
	}
	if !helpers.SemanticNullishType(value, false) && !rule.memberNullable(node) {
		if rule.unchecked() || !rule.arrayIndex(node) && !rule.arrayChain(node) {
			rule.context.Report(rule.context.Range(node), diagnostics.Unnecessary_conditional_expected_left_hand_side_of_operator_to_be_possibly_null_or_undefined)
		}
		return
	}
	for _, part := range helpers.SemanticUnionParts(value) {
		if part.Flags()&(checker.TypeFlagsNull|checker.TypeFlagsUndefined) == 0 {
			return
		}
	}
	if node.Kind == ast.KindElementAccessExpression {
		object := rule.context.GetChecker().GetNonNullableType(helpers.SemanticTypeAtLocation(rule.context, node.Expression()))
		for _, key := range helpers.SemanticUnionParts(helpers.SemanticTypeAtLocation(rule.context, node.AsElementAccessExpression().ArgumentExpression)) {
			literal, known := helpers.SemanticLiteralValue(key)
			if !known {
				return
			}
			propertyType := rule.context.GetChecker().GetTypeOfPropertyOfType(object, noUnnecessaryConditionValueString(literal))
			if propertyType == nil {
				return
			}
			for _, part := range helpers.SemanticUnionParts(propertyType) {
				if part.Flags()&(checker.TypeFlagsNull|checker.TypeFlagsUndefined|checker.TypeFlagsVoid) == 0 {
					return
				}
			}
		}
	}
	rule.context.Report(rule.context.Range(node), diagnostics.Unnecessary_conditional_left_hand_side_of_operator_is_always_null_or_undefined)
}

func noUnnecessaryConditionValueString(value any) string {
	switch value := value.(type) {
	case string:
		return value
	case bool:
		return strconv.FormatBool(value)
	case jsnum.Number:
		return value.String()
	case jsnum.PseudoBigInt:
		return value.String()
	}
	return "null"
}

func noUnnecessaryConditionComparison(left, right *checker.Type, operator ast.Kind) bool {
	leftValue, _ := helpers.SemanticLiteralValue(left)
	rightValue, _ := helpers.SemanticLiteralValue(right)
	strict := operator == ast.KindEqualsEqualsEqualsToken || operator == ast.KindExclamationEqualsEqualsToken
	equality := operator == ast.KindEqualsEqualsToken || operator == ast.KindEqualsEqualsEqualsToken || operator == ast.KindExclamationEqualsToken || operator == ast.KindExclamationEqualsEqualsToken
	leftNull := left.Flags()&(checker.TypeFlagsNull|checker.TypeFlagsUndefined) != 0
	rightNull := right.Flags()&(checker.TypeFlagsNull|checker.TypeFlagsUndefined) != 0
	result := false
	if equality {
		if leftNull || rightNull {
			result = leftNull && rightNull && (!strict || left.Flags() == right.Flags())
		} else if leftValue == rightValue {
			result = true
		} else if !strict {
			result = noUnnecessaryConditionNumber(leftValue) == noUnnecessaryConditionNumber(rightValue)
		}
		if operator == ast.KindExclamationEqualsToken || operator == ast.KindExclamationEqualsEqualsToken {
			result = !result
		}
		return result
	}
	order := 0
	if leftString, ok := leftValue.(string); ok {
		if rightString, ok := rightValue.(string); ok {
			order = cmp.Compare(leftString, rightString)
		} else {
			order = cmp.Compare(noUnnecessaryConditionNumber(leftValue), noUnnecessaryConditionNumber(rightValue))
		}
	} else if leftBig, ok := leftValue.(jsnum.PseudoBigInt); ok {
		if rightBig, ok := rightValue.(jsnum.PseudoBigInt); ok {
			order = leftBig.Compare(rightBig)
		} else {
			order = cmp.Compare(noUnnecessaryConditionNumber(leftValue), noUnnecessaryConditionNumber(rightValue))
		}
	} else {
		order = cmp.Compare(noUnnecessaryConditionNumber(leftValue), noUnnecessaryConditionNumber(rightValue))
	}
	if noUnnecessaryConditionNumber(leftValue).IsNaN() || noUnnecessaryConditionNumber(rightValue).IsNaN() {
		_, leftString := leftValue.(string)
		_, rightString := rightValue.(string)
		if !leftString || !rightString {
			return false
		}
	}
	switch operator {
	case ast.KindLessThanToken:
		return order < 0
	case ast.KindLessThanEqualsToken:
		return order <= 0
	case ast.KindGreaterThanToken:
		return order > 0
	case ast.KindGreaterThanEqualsToken:
		return order >= 0
	}
	return false
}

func noUnnecessaryConditionNumber(value any) jsnum.Number {
	switch value := value.(type) {
	case nil:
		return 0
	case bool:
		if value {
			return 1
		}
		return 0
	case jsnum.Number:
		return value
	case jsnum.PseudoBigInt:
		return jsnum.FromString(value.String())
	case string:
		return jsnum.FromString(value)
	}
	return jsnum.FromString("NaN")
}

func noUnnecessaryConditionTypeText(value *checker.Type) string {
	if value.Flags()&checker.TypeFlagsNull != 0 {
		return "null"
	}
	if value.Flags()&checker.TypeFlagsUndefined != 0 {
		return "undefined"
	}
	if value.Flags()&checker.TypeFlagsEnumLiteral != 0 && value.Symbol() != nil && value.Symbol().Parent() != nil {
		return value.Symbol().Parent().Name() + "." + value.Symbol().Name()
	}
	literal, _ := helpers.SemanticLiteralValue(value)
	if text, ok := literal.(string); ok {
		return strconv.Quote(text)
	}
	if value.Flags()&checker.TypeFlagsBigIntLiteral != 0 {
		return noUnnecessaryConditionValueString(literal) + "n"
	}
	return noUnnecessaryConditionValueString(literal)
}

func (rule *typescriptNoUnnecessaryConditionRule) comparison(node, left, right *ast.Node, operator ast.Kind) {
	leftType, rightType := helpers.SemanticTypeAtLocation(rule.context, left), helpers.SemanticTypeAtLocation(rule.context, right)
	_, leftKnown := helpers.SemanticLiteralValue(leftType)
	_, rightKnown := helpers.SemanticLiteralValue(rightType)
	if leftKnown && rightKnown {
		rule.context.Report(rule.context.Range(node), diagnostics.Unnecessary_conditional_comparison_is_always_0_since_1_2_3_is_0, strconv.FormatBool(noUnnecessaryConditionComparison(leftType, rightType, operator)), noUnnecessaryConditionTypeText(leftType), scanner.TokenToString(operator), noUnnecessaryConditionTypeText(rightType))
		return
	}
	if !helpers.SemanticStrictNullChecks(rule.context) {
		return
	}
	for _, pair := range [][2]*checker.Type{{leftType, rightType}, {rightType, leftType}} {
		flag := pair[0].Flags()
		if flag != checker.TypeFlagsNull && flag != checker.TypeFlagsUndefined {
			continue
		}
		if flag == checker.TypeFlagsUndefined {
			flag |= checker.TypeFlagsVoid
		}
		if operator == ast.KindEqualsEqualsToken || operator == ast.KindExclamationEqualsToken {
			flag |= checker.TypeFlagsNull | checker.TypeFlagsUndefined | checker.TypeFlagsVoid
		}
		if !helpers.SemanticUncertainType(pair[1]) && helpers.SemanticTypeFlags(pair[1])&flag == 0 {
			rule.context.Report(rule.context.Range(node), diagnostics.Unnecessary_conditional_the_types_have_no_overlap)
			return
		}
	}
}

func (rule *typescriptNoUnnecessaryConditionRule) ownNullable(node *ast.Node) bool {
	node = ast.SkipParentheses(node)
	if !helpers.SemanticNullishType(helpers.SemanticTypeAtLocation(rule.context, node), true) {
		return false
	}
	if !ast.IsOptionalChain(node) {
		return true
	}
	typeChecker := rule.context.GetChecker()
	switch node.Kind {
	case ast.KindPropertyAccessExpression:
		object := typeChecker.GetNonNullableType(helpers.SemanticTypeAtLocation(rule.context, node.Expression()))
		property := typeChecker.GetTypeOfPropertyOfType(object, node.Name().Text())
		return property == nil || helpers.SemanticNullishType(property, true)
	case ast.KindElementAccessExpression:
		object := typeChecker.GetNonNullableType(helpers.SemanticTypeAtLocation(rule.context, node.Expression()))
		for _, key := range helpers.SemanticUnionParts(helpers.SemanticTypeAtLocation(rule.context, node.AsElementAccessExpression().ArgumentExpression)) {
			literal, known := helpers.SemanticLiteralValue(key)
			if known {
				property := typeChecker.GetTypeOfPropertyOfType(object, noUnnecessaryConditionValueString(literal))
				if property != nil {
					if helpers.SemanticNullishType(property, true) {
						return true
					}
					continue
				}
			}
			for _, info := range typeChecker.GetIndexInfosOfType(object) {
				if rule.unchecked() || helpers.SemanticNullishType(info.ValueType(), true) {
					return true
				}
			}
		}
		return false
	case ast.KindCallExpression:
		callee := typeChecker.GetNonNullableType(helpers.SemanticTypeAtLocation(rule.context, node.Expression()))
		for _, signature := range typeChecker.GetSignaturesOfType(callee, checker.SignatureKindCall) {
			if helpers.SemanticNullishType(typeChecker.GetReturnTypeOfSignature(signature), true) {
				return true
			}
		}
		return false
	}
	return true
}

func (rule *typescriptNoUnnecessaryConditionRule) optional(node *ast.Node) {
	if node.QuestionDotToken() == nil || !rule.unchecked() && rule.arrayChain(node) {
		return
	}
	left := node.Expression()
	if helpers.SemanticUncertainType(helpers.SemanticTypeAtLocation(rule.context, left)) || rule.ownNullable(left) {
		return
	}
	token := node.QuestionDotToken()
	report := rule.context.Report(
		core.NewTextRange(scanner.GetTokenPosOfNode(token, rule.context.File, false), token.End()), diagnostics.Unnecessary_optional_chain_on_a_non_nullish_value)

	replacement := ""
	if node.Kind == ast.KindPropertyAccessExpression {
		replacement = "."
	}
	rule.suggest(report, token, replacement, diagnostics.Remove_unnecessary_optional_chain)
}

func (rule *typescriptNoUnnecessaryConditionRule) call(node *ast.Node) {
	if helpers.SemanticBooleanOption(rule.context, "checkTypePredicates", false) {
		if argument, predicate := helpers.SemanticAssertionArgument(rule.context, node); argument != nil {
			if predicate.Type() == nil && predicate.Kind() == checker.TypePredicateKindAssertsIdentifier {
				rule.check(argument)
			} else if predicate.Type() != nil {
				value := helpers.SemanticTypeAtLocation(rule.context, argument)
				typeChecker := rule.context.GetChecker()
				if helpers.SemanticTypeFlags(value)&(checker.TypeFlagsAny|checker.TypeFlagsUnknown) == 0 && typeChecker.IsTypeAssignableTo(value, predicate.Type()) && (predicate.Type().IsUnion() || typeChecker.IsTypeAssignableTo(predicate.Type(), value)) {
					kind := "type guard"
					if predicate.Kind() == checker.TypePredicateKindAssertsIdentifier {
						kind = "assertion function"
					}
					rule.context.Report(rule.context.Range(argument), diagnostics.Unnecessary_conditional_expression_already_has_the_type_being_checked_by_the_0, kind)
				}
			}
		}
	}
	callback := helpers.SemanticPredicateCallback(rule.context, node)
	if callback == nil {
		return
	}
	if callback.Kind == ast.KindArrowFunction || callback.Kind == ast.KindFunctionExpression {
		body := callback.Body()
		if body.Kind != ast.KindBlock {
			rule.check(body)
			return
		}
		statements := body.AsBlock().Statements.Nodes
		if len(statements) == 1 && statements[0].Kind == ast.KindReturnStatement && statements[0].Expression() != nil {
			rule.check(statements[0].Expression())
			return
		}
	}
	signatures := rule.context.GetChecker().GetSignaturesOfType(helpers.SemanticTypeAtLocation(rule.context, callback), checker.SignatureKindCall)
	if len(signatures) == 0 {
		return
	}
	truthy, falsy := false, false
	for _, signature := range signatures {
		value := rule.context.GetChecker().GetReturnTypeOfSignature(signature)
		if constraint := rule.context.GetChecker().GetBaseConstraintOfType(value); constraint != nil {
			value = constraint
		}
		if helpers.SemanticUncertainType(value) {
			return
		}
		partTruthy, partFalsy := helpers.SemanticTruthiness(value)
		truthy, falsy = truthy || partTruthy, falsy || partFalsy
	}
	if !falsy {
		rule.context.Report(rule.context.Range(callback), diagnostics.This_callback_should_return_a_conditional_but_return_is_always_truthy)
	} else if !truthy {
		rule.context.Report(rule.context.Range(callback), diagnostics.This_callback_should_return_a_conditional_but_return_is_always_falsy)
	}
}

func (rule *typescriptNoUnnecessaryConditionRule) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindSourceFile {
		helpers.SemanticRequireStrictNullChecks(rule.context)
	}
	if test, loop := helpers.SemanticConditionTest(node); test != nil {
		allowed := helpers.SemanticRuleOptions(rule.context.Options)["allowConstantLoopConditions"]
		skip := false
		if loop && (allowed == true || allowed == "always") {
			skip = helpers.SemanticTypeAtLocation(rule.context, test).Flags()&checker.TypeFlagsBooleanLiteral != 0 && helpers.SemanticTruthyLiteral(helpers.SemanticTypeAtLocation(rule.context, test))
		}
		if loop && allowed == "only-allowed-literals" {
			literal := ast.SkipParentheses(test)
			skip = literal.Kind == ast.KindTrueKeyword || literal.Kind == ast.KindFalseKeyword || literal.Kind == ast.KindNumericLiteral && (literal.Text() == "1" || literal.Text() == "0")
		}
		if !skip {
			rule.check(test)
		}
	}
	if node.Kind == ast.KindBinaryExpression {
		binary := node.AsBinaryExpression()
		switch binary.OperatorToken.Kind {
		case ast.KindQuestionQuestionToken, ast.KindQuestionQuestionEqualsToken:
			rule.nullish(binary.Left)
		case ast.KindAmpersandAmpersandToken, ast.KindBarBarToken, ast.KindAmpersandAmpersandEqualsToken, ast.KindBarBarEqualsToken:
			rule.check(binary.Left)
		case ast.KindEqualsEqualsToken, ast.KindEqualsEqualsEqualsToken, ast.KindExclamationEqualsToken, ast.KindExclamationEqualsEqualsToken, ast.KindLessThanToken, ast.KindLessThanEqualsToken, ast.KindGreaterThanToken, ast.KindGreaterThanEqualsToken:
			rule.comparison(node, binary.Left, binary.Right, binary.OperatorToken.Kind)
		}
	}
	if node.Kind == ast.KindCallExpression {
		rule.call(node)
		rule.optional(node)
	}
	if node.Kind == ast.KindPropertyAccessExpression || node.Kind == ast.KindElementAccessExpression {
		rule.optional(node)
	}
	if node.Kind == ast.KindCaseClause {
		rule.comparison(node.AsCaseOrDefaultClause().Expression, node.Parent.Parent.AsSwitchStatement().Expression, node.AsCaseOrDefaultClause().Expression, ast.KindEqualsEqualsEqualsToken)
	}
	return true
}

func (rule *typescriptNoUnnecessaryConditionRule) OnExitNode(node *ast.Node) {}

func (rule *typescriptNoUnnecessaryConditionRule) Suggestions() map[*ast.Diagnostic][]*codefix.CodeFixAction {
	return rule.suggestions
}

func (rule *typescriptNoUnnecessaryConditionRule) suggest(report *ast.Diagnostic, node *ast.Node, text string, message *diagnostics.Message, args ...any) {
	tracker := rule.context.NewTracker()
	tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(scanner.GetTokenPosOfNode(node, rule.context.File, false), node.End()), text)
	if rule.suggestions == nil {
		rule.suggestions = make(map[*ast.Diagnostic][]*codefix.CodeFixAction)
	}
	rule.suggestions[report] = append(rule.suggestions[report], codefix.CreateCodeFixAction("@typescript-eslint/no-unnecessary-condition", tracker.GetTextChanges(), ast.NewCompilerDiagnostic(message, args...), "", nil))
}

func newTypeScriptNoUnnecessaryCondition(context Context) Rule {
	return &typescriptNoUnnecessaryConditionRule{context: context}
}
