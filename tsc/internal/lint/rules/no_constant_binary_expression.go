package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/jsnum"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type noConstantBinaryExpression struct {
	context Context
}

func newNoConstantBinaryExpression(context Context) Rule {
	rule := &noConstantBinaryExpression{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindBinaryExpression},
	}
}

func (rule *noConstantBinaryExpression) OnEnterNode(node *ast.Node) bool {
	if node.Kind != ast.KindBinaryExpression {
		return true
	}
	expression := node.AsBinaryExpression()
	left, right := ast.SkipParentheses(expression.Left), ast.SkipParentheses(expression.Right)
	operator := expression.OperatorToken.Kind
	operatorText := scanner.TokenToString(operator)
	switch operator {
	case ast.KindAmpersandAmpersandToken, ast.KindBarBarToken:
		if rule.isConstant(left, true) {
			rule.context.Report(rule.context.Range(left), constantShortCircuitMessage, "truthiness", operatorText)
		}
	case ast.KindQuestionQuestionToken:
		if rule.hasConstantNullishness(left, false) {
			rule.context.Report(rule.context.Range(left), constantShortCircuitMessage, "nullishness", operatorText)
		}
	case ast.KindEqualsEqualsToken, ast.KindExclamationEqualsToken, ast.KindEqualsEqualsEqualsToken, ast.KindExclamationEqualsEqualsToken:
		if rule.constantOperand(left, right, operator) {
			rule.context.Report(rule.context.Range(right), constantBinaryOperandMessage, "left", operatorText)
		} else if rule.constantOperand(right, left, operator) {
			rule.context.Report(rule.context.Range(left), constantBinaryOperandMessage, "right", operatorText)
		} else if operator == ast.KindEqualsEqualsEqualsToken || operator == ast.KindExclamationEqualsEqualsToken {
			if rule.isAlwaysNew(left) {
				rule.context.Report(rule.context.Range(left), constantAlwaysNewMessage)
			} else if rule.isAlwaysNew(right) {
				rule.context.Report(rule.context.Range(right), constantAlwaysNewMessage)
			}
		} else if rule.isAlwaysNew(left) && rule.isAlwaysNew(right) {
			rule.context.Report(rule.context.Range(left), constantBothAlwaysNewMessage)
		}
	case ast.KindLessThanToken, ast.KindLessThanEqualsToken, ast.KindGreaterThanToken, ast.KindGreaterThanEqualsToken:
		if helpers.ExpressionBooleanOption(rule.context, "checkRelationalComparisons", false) && rule.isStaticLiteral(left) && rule.isStaticLiteral(right) {
			rule.context.Report(rule.context.Range(node), diagnostics.Unexpected_constant_relational_comparison_Both_sides_of_the_0_are_literal_values, operatorText)
		}
	}
	return true
}

var (
	constantBinaryOperandMessage = diagnostics.Unexpected_constant_binary_expression_Compares_constantly_with_the_0_hand_side_of_the_1
	constantShortCircuitMessage  = diagnostics.Unexpected_constant_0_on_the_left_hand_side_of_a_1_expression
	constantAlwaysNewMessage     = diagnostics.Unexpected_comparison_to_newly_constructed_object_These_two_values_can_never_be_equal
	constantBothAlwaysNewMessage = diagnostics.Unexpected_comparison_of_two_newly_constructed_objects_These_two_values_can_never_be_equal
)

func (rule *noConstantBinaryExpression) isStaticLiteral(node *ast.Node) bool {
	if constantBinaryLiteral(node) || node.Kind == ast.KindNoSubstitutionTemplateLiteral {
		return true
	}
	if node.Kind == ast.KindPrefixUnaryExpression {
		expression := node.AsPrefixUnaryExpression()
		return (expression.Operator == ast.KindMinusToken || expression.Operator == ast.KindPlusToken || expression.Operator == ast.KindTildeToken) &&
			constantBinaryLiteral(ast.SkipParentheses(expression.Operand))
	}
	return rule.isGlobal(node, "undefined")
}

func (rule *noConstantBinaryExpression) isGlobal(node *ast.Node, names ...string) bool {
	node = ast.SkipParentheses(node)
	if node.Kind != ast.KindIdentifier {
		return false
	}
	for _, name := range names {
		if node.Text() == name {
			return expressionGlobalReference(rule.context, node)
		}
	}
	return false
}

func (rule *noConstantBinaryExpression) isNullOrUndefined(node *ast.Node) bool {
	node = ast.SkipParentheses(node)
	return node.Kind == ast.KindNullKeyword || node.Kind == ast.KindVoidExpression || rule.isGlobal(node, "undefined")
}

func constantBinaryLiteral(node *ast.Node) bool {
	switch node.Kind {
	case ast.KindNumericLiteral, ast.KindBigIntLiteral, ast.KindStringLiteral, ast.KindRegularExpressionLiteral,
		ast.KindTrueKeyword, ast.KindFalseKeyword, ast.KindNullKeyword:
		return true
	}
	return false
}

func constantBinaryLogicalAssignment(operator ast.Kind) bool {
	return operator == ast.KindAmpersandAmpersandEqualsToken || operator == ast.KindBarBarEqualsToken || operator == ast.KindQuestionQuestionEqualsToken
}

func (rule *noConstantBinaryExpression) hasConstantNullishness(node *ast.Node, nonNullish bool) bool {
	node = ast.SkipParentheses(node)
	if nonNullish && rule.isNullOrUndefined(node) {
		return false
	}
	if constantBinaryLiteral(node) {
		return true
	}
	switch node.Kind {
	case ast.KindObjectLiteralExpression, ast.KindArrayLiteralExpression, ast.KindArrowFunction, ast.KindFunctionExpression,
		ast.KindClassExpression, ast.KindNewExpression, ast.KindTemplateExpression, ast.KindNoSubstitutionTemplateLiteral,
		ast.KindPrefixUnaryExpression, ast.KindPostfixUnaryExpression, ast.KindTypeOfExpression, ast.KindVoidExpression, ast.KindDeleteExpression:
		return true
	case ast.KindCallExpression:
		return node.Flags&ast.NodeFlagsOptionalChain == 0 && rule.isGlobal(node.Expression(), "Boolean", "String", "Number", "Symbol", "BigInt")
	case ast.KindBinaryExpression:
		expression := node.AsBinaryExpression()
		operator := expression.OperatorToken.Kind
		switch operator {
		case ast.KindCommaToken, ast.KindEqualsToken:
			return rule.hasConstantNullishness(expression.Right, nonNullish)
		case ast.KindAmpersandAmpersandToken, ast.KindBarBarToken:
			return false
		case ast.KindQuestionQuestionToken:
			return rule.hasConstantNullishness(expression.Right, true)
		}
		return !constantBinaryLogicalAssignment(operator)
	case ast.KindIdentifier:
		return rule.isGlobal(node, "undefined")
	}
	return false
}

func (rule *noConstantBinaryExpression) isStaticBoolean(node *ast.Node) bool {
	node = ast.SkipParentheses(node)
	switch node.Kind {
	case ast.KindTrueKeyword, ast.KindFalseKeyword:
		return true
	case ast.KindPrefixUnaryExpression:
		return node.AsPrefixUnaryExpression().Operator == ast.KindExclamationToken && rule.isConstant(node.AsPrefixUnaryExpression().Operand, true)
	case ast.KindCallExpression:
		expression := node.AsCallExpression()
		return node.Flags&ast.NodeFlagsOptionalChain == 0 && rule.isGlobal(expression.Expression, "Boolean") &&
			(len(expression.Arguments.Nodes) == 0 || rule.isConstant(expression.Arguments.Nodes[0], true))
	}
	return false
}

func (rule *noConstantBinaryExpression) hasConstantLooseBooleanComparison(node *ast.Node) bool {
	node = ast.SkipParentheses(node)
	if constantBinaryLiteral(node) {
		return true
	}
	switch node.Kind {
	case ast.KindObjectLiteralExpression, ast.KindClassExpression, ast.KindArrowFunction, ast.KindFunctionExpression,
		ast.KindVoidExpression, ast.KindTypeOfExpression, ast.KindNoSubstitutionTemplateLiteral:
		return true
	case ast.KindArrayLiteralExpression:
		elements := node.AsArrayLiteralExpression().Elements.Nodes
		count := 0
		for _, element := range elements {
			if element.Kind != ast.KindOmittedExpression && element.Kind != ast.KindSpreadElement {
				count++
			}
		}
		return len(elements) == 0 || count > 1
	case ast.KindPrefixUnaryExpression:
		return node.AsPrefixUnaryExpression().Operator == ast.KindExclamationToken && rule.isConstant(node.AsPrefixUnaryExpression().Operand, true)
	case ast.KindCallExpression:
		return rule.isStaticBoolean(node)
	case ast.KindIdentifier:
		return rule.isGlobal(node, "undefined")
	case ast.KindBinaryExpression:
		expression := node.AsBinaryExpression()
		if expression.OperatorToken.Kind == ast.KindCommaToken || expression.OperatorToken.Kind == ast.KindEqualsToken {
			return rule.hasConstantLooseBooleanComparison(expression.Right)
		}
	}
	return false
}

func constantBinaryNumericOrStringOperator(operator ast.Kind) bool {
	switch operator {
	case ast.KindPlusToken, ast.KindMinusToken, ast.KindAsteriskToken, ast.KindSlashToken, ast.KindPercentToken,
		ast.KindBarToken, ast.KindCaretToken, ast.KindAmpersandToken, ast.KindAsteriskAsteriskToken,
		ast.KindLessThanLessThanToken, ast.KindGreaterThanGreaterThanToken, ast.KindGreaterThanGreaterThanGreaterThanToken:
		return true
	}
	return false
}

func (rule *noConstantBinaryExpression) hasConstantStrictBooleanComparison(node *ast.Node) bool {
	node = ast.SkipParentheses(node)
	if constantBinaryLiteral(node) {
		return true
	}
	switch node.Kind {
	case ast.KindObjectLiteralExpression, ast.KindArrayLiteralExpression, ast.KindArrowFunction, ast.KindFunctionExpression,
		ast.KindClassExpression, ast.KindNewExpression, ast.KindTemplateExpression, ast.KindNoSubstitutionTemplateLiteral,
		ast.KindPostfixUnaryExpression, ast.KindTypeOfExpression, ast.KindVoidExpression:
		return true
	case ast.KindPrefixUnaryExpression:
		if node.AsPrefixUnaryExpression().Operator == ast.KindExclamationToken {
			return rule.isConstant(node.AsPrefixUnaryExpression().Operand, true)
		}
		return true
	case ast.KindBinaryExpression:
		expression := node.AsBinaryExpression()
		operator := expression.OperatorToken.Kind
		if operator == ast.KindCommaToken || operator == ast.KindEqualsToken {
			return rule.hasConstantStrictBooleanComparison(expression.Right)
		}
		if ast.IsAssignmentOperator(operator) {
			return !constantBinaryLogicalAssignment(operator)
		}
		return constantBinaryNumericOrStringOperator(operator)
	case ast.KindIdentifier:
		return rule.isGlobal(node, "undefined")
	case ast.KindCallExpression:
		return node.Flags&ast.NodeFlagsOptionalChain == 0 &&
			(rule.isGlobal(node.Expression(), "String", "Number", "BigInt", "Symbol") || rule.isStaticBoolean(node))
	}
	return false
}

func (rule *noConstantBinaryExpression) isAlwaysNew(node *ast.Node) bool {
	node = ast.SkipParentheses(node)
	switch node.Kind {
	case ast.KindObjectLiteralExpression, ast.KindArrayLiteralExpression, ast.KindArrowFunction, ast.KindFunctionExpression,
		ast.KindClassExpression, ast.KindRegularExpressionLiteral:
		return true
	case ast.KindNewExpression:
		callee := ast.SkipParentheses(node.Expression())
		return callee.Kind == ast.KindIdentifier && constantBinaryECMAScriptGlobal(callee.Text()) && expressionGlobalReference(rule.context, callee)
	case ast.KindBinaryExpression:
		expression := node.AsBinaryExpression()
		if expression.OperatorToken.Kind == ast.KindCommaToken || expression.OperatorToken.Kind == ast.KindEqualsToken {
			return rule.isAlwaysNew(expression.Right)
		}
	case ast.KindConditionalExpression:
		expression := node.AsConditionalExpression()
		return rule.isAlwaysNew(expression.WhenTrue) && rule.isAlwaysNew(expression.WhenFalse)
	}
	return false
}

func constantBinaryECMAScriptGlobal(name string) bool {
	switch name {
	case "AggregateError", "Array", "ArrayBuffer", "AsyncDisposableStack", "Atomics", "BigInt", "BigInt64Array", "BigUint64Array",
		"Boolean", "DataView", "Date", "decodeURI", "decodeURIComponent", "DisposableStack", "encodeURI", "encodeURIComponent",
		"Error", "escape", "eval", "EvalError", "FinalizationRegistry", "Float16Array", "Float32Array", "Float64Array", "Function",
		"globalThis", "Infinity", "Int16Array", "Int32Array", "Int8Array", "Intl", "isFinite", "isNaN", "Iterator", "JSON", "Map",
		"Math", "NaN", "Number", "Object", "parseFloat", "parseInt", "Promise", "Proxy", "RangeError", "ReferenceError", "Reflect",
		"RegExp", "Set", "SharedArrayBuffer", "String", "SuppressedError", "Symbol", "SyntaxError", "TypeError", "Uint16Array",
		"Uint32Array", "Uint8Array", "Uint8ClampedArray", "undefined", "unescape", "URIError", "WeakMap", "WeakRef", "WeakSet":
		return true
	}
	return false
}

func (rule *noConstantBinaryExpression) constantOperand(left *ast.Node, right *ast.Node, operator ast.Kind) bool {
	if rule.isNullOrUndefined(left) && rule.hasConstantNullishness(right, false) {
		return true
	}
	if !rule.isStaticBoolean(left) {
		return false
	}
	if operator == ast.KindEqualsEqualsToken || operator == ast.KindExclamationEqualsToken {
		return rule.hasConstantLooseBooleanComparison(right)
	}
	return rule.hasConstantStrictBooleanComparison(right)
}

func (rule *noConstantBinaryExpression) isConstant(node *ast.Node, booleanPosition bool) bool {
	node = ast.SkipParentheses(node)
	if constantBinaryLiteral(node) {
		return true
	}
	switch node.Kind {
	case ast.KindArrowFunction, ast.KindFunctionExpression, ast.KindClassExpression, ast.KindObjectLiteralExpression,
		ast.KindNoSubstitutionTemplateLiteral, ast.KindOmittedExpression, ast.KindVoidExpression:
		return true
	case ast.KindTemplateExpression:
		expression := node.AsTemplateExpression()
		if booleanPosition {
			if expression.Head.Text() != "" {
				return true
			}
			for _, span := range expression.TemplateSpans.Nodes {
				if span.AsTemplateSpan().Literal.Text() != "" {
					return true
				}
			}
		}
		for _, span := range expression.TemplateSpans.Nodes {
			if !rule.isConstant(span.AsTemplateSpan().Expression, false) {
				return false
			}
		}
		return true
	case ast.KindArrayLiteralExpression:
		if booleanPosition {
			return true
		}
		for _, element := range node.AsArrayLiteralExpression().Elements.Nodes {
			if !rule.isConstant(element, false) {
				return false
			}
		}
		return true
	case ast.KindTypeOfExpression:
		return booleanPosition || rule.isConstant(node.Expression(), false)
	case ast.KindDeleteExpression:
		return rule.isConstant(node.Expression(), false)
	case ast.KindPrefixUnaryExpression:
		expression := node.AsPrefixUnaryExpression()
		if expression.Operator == ast.KindPlusPlusToken || expression.Operator == ast.KindMinusMinusToken {
			return false
		}
		return rule.isConstant(expression.Operand, expression.Operator == ast.KindExclamationToken)
	case ast.KindBinaryExpression:
		expression := node.AsBinaryExpression()
		operator := expression.OperatorToken.Kind
		switch operator {
		case ast.KindCommaToken, ast.KindEqualsToken:
			return rule.isConstant(expression.Right, booleanPosition)
		case ast.KindBarBarEqualsToken:
			return booleanPosition && rule.isLogicalIdentity(expression.Right, ast.KindBarBarToken)
		case ast.KindAmpersandAmpersandEqualsToken:
			return booleanPosition && rule.isLogicalIdentity(expression.Right, ast.KindAmpersandAmpersandToken)
		case ast.KindAmpersandAmpersandToken, ast.KindBarBarToken, ast.KindQuestionQuestionToken:
			leftConstant := rule.isConstant(expression.Left, booleanPosition)
			rightConstant := rule.isConstant(expression.Right, booleanPosition)
			return (leftConstant && rightConstant) ||
				(leftConstant && rule.isLogicalIdentity(expression.Left, operator)) ||
				(booleanPosition && rightConstant && rule.isLogicalIdentity(expression.Right, operator))
		}
		return !ast.IsAssignmentOperator(operator) && operator != ast.KindInKeyword && rule.isConstant(expression.Left, false) && rule.isConstant(expression.Right, false)
	case ast.KindNewExpression:
		return booleanPosition
	case ast.KindSpreadElement:
		return rule.isConstant(node.Expression(), booleanPosition)
	case ast.KindCallExpression:
		return rule.isStaticBoolean(node)
	case ast.KindIdentifier:
		return rule.isGlobal(node, "undefined")
	}
	return false
}

func (rule *noConstantBinaryExpression) isLogicalIdentity(node *ast.Node, operator ast.Kind) bool {
	node = ast.SkipParentheses(node)
	if constantBinaryLiteral(node) {
		truthy := false
		switch node.Kind {
		case ast.KindTrueKeyword, ast.KindRegularExpressionLiteral:
			truthy = true
		case ast.KindNumericLiteral:
			number := jsnum.FromString(node.Text())
			truthy = number != 0 && !number.IsNaN()
		case ast.KindBigIntLiteral:
			for _, digit := range node.Text() {
				if digit >= '1' && digit <= '9' || digit >= 'a' && digit <= 'f' || digit >= 'A' && digit <= 'F' {
					truthy = true
				}
			}
		case ast.KindStringLiteral:
			truthy = node.Text() != ""
		}
		return operator == ast.KindBarBarToken && truthy || operator == ast.KindAmpersandAmpersandToken && !truthy
	}
	switch node.Kind {
	case ast.KindVoidExpression:
		return operator == ast.KindAmpersandAmpersandToken
	case ast.KindBinaryExpression:
		expression := node.AsBinaryExpression()
		if expression.OperatorToken.Kind == operator && ast.IsLogicalOrCoalescingBinaryOperator(operator) {
			return rule.isLogicalIdentity(expression.Left, operator) || rule.isLogicalIdentity(expression.Right, operator)
		}
		if expression.OperatorToken.Kind == ast.KindBarBarEqualsToken && operator == ast.KindBarBarToken ||
			expression.OperatorToken.Kind == ast.KindAmpersandAmpersandEqualsToken && operator == ast.KindAmpersandAmpersandToken {
			return rule.isLogicalIdentity(expression.Right, operator)
		}
	}
	return false
}
