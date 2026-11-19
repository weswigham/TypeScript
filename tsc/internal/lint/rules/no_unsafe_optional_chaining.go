package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type noUnsafeOptionalChainingRule struct {
	context                     Context
	disallowArithmeticOperators bool
}

func newNoUnsafeOptionalChaining(context Context) Rule {
	rule := &noUnsafeOptionalChainingRule{
		context:                     context,
		disallowArithmeticOperators: helpers.ExpressionBooleanOption(context, "disallowArithmeticOperators", false),
	}

	return Rule{
		Enter: rule.OnEnterNode,
		EnterKinds: []ast.Kind{
			ast.KindBinaryExpression,
			ast.KindBindingElement,
			ast.KindCallExpression,
			ast.KindElementAccessExpression,
			ast.KindExpressionWithTypeArguments,
			ast.KindForOfStatement,
			ast.KindNewExpression,
			ast.KindParameter,
			ast.KindPrefixUnaryExpression,
			ast.KindPropertyAccessExpression,
			ast.KindSpreadElement,
			ast.KindTaggedTemplateExpression,
			ast.KindVariableDeclaration,
			ast.KindWithStatement,
			ast.KindYieldExpression,
		},
	}
}

func (rule *noUnsafeOptionalChainingRule) OnEnterNode(node *ast.Node) bool {
	rule.checkOptional(node)
	return true
}

func (rule *noUnsafeOptionalChainingRule) checkOptional(node *ast.Node) {
	switch node.Kind {
	case ast.KindCallExpression, ast.KindPropertyAccessExpression, ast.KindElementAccessExpression:
		if !ast.IsOptionalChain(node) {
			rule.optionalShortCircuit(node.Expression(), false)
		}
	case ast.KindNewExpression, ast.KindWithStatement, ast.KindForOfStatement, ast.KindSpreadElement:
		rule.optionalShortCircuit(node.Expression(), false)
	case ast.KindTaggedTemplateExpression:
		rule.optionalShortCircuit(node.AsTaggedTemplateExpression().Tag, false)
	case ast.KindYieldExpression:
		if node.AsYieldExpression().AsteriskToken != nil {
			rule.optionalShortCircuit(node.Expression(), false)
		}
	case ast.KindVariableDeclaration, ast.KindBindingElement, ast.KindParameter:
		if optionalChainDestructuringPattern(node.Name()) {
			rule.optionalShortCircuit(node.Initializer(), false)
		}
	case ast.KindExpressionWithTypeArguments:
		if ast.IsExpressionWithTypeArgumentsInClassExtendsClause(node) {
			rule.optionalShortCircuit(node.Expression(), false)
		}
	case ast.KindBinaryExpression:
		expression := node.AsBinaryExpression()
		switch expression.OperatorToken.Kind {
		case ast.KindEqualsToken:
			if optionalChainDestructuringPattern(expression.Left) {
				rule.optionalShortCircuit(expression.Right, false)
			}
		case ast.KindInKeyword, ast.KindInstanceOfKeyword:
			rule.optionalShortCircuit(expression.Right, false)
		case ast.KindPlusToken, ast.KindMinusToken, ast.KindSlashToken, ast.KindAsteriskToken, ast.KindPercentToken, ast.KindAsteriskAsteriskToken:
			if rule.disallowArithmeticOperators {
				rule.optionalShortCircuit(expression.Right, true)
				rule.optionalShortCircuit(expression.Left, true)
			}
		case ast.KindPlusEqualsToken, ast.KindMinusEqualsToken, ast.KindSlashEqualsToken, ast.KindAsteriskEqualsToken, ast.KindPercentEqualsToken, ast.KindAsteriskAsteriskEqualsToken:
			if rule.disallowArithmeticOperators {
				rule.optionalShortCircuit(expression.Right, true)
			}
		}
	case ast.KindPrefixUnaryExpression:
		operator := node.AsPrefixUnaryExpression().Operator
		if (operator == ast.KindPlusToken || operator == ast.KindMinusToken) && rule.disallowArithmeticOperators {
			rule.optionalShortCircuit(node.AsPrefixUnaryExpression().Operand, true)
		}
	}
}

func (rule *noUnsafeOptionalChainingRule) optionalShortCircuit(node *ast.Node, arithmetic bool) {
	if node == nil {
		return
	}
	node = ast.SkipParentheses(node)
	if ast.IsOptionalChain(node) {
		if arithmetic {
			rule.context.Report(rule.context.Range(node), diagnostics.Unsafe_arithmetic_operation_on_optional_chaining_It_can_result_in_NaN)
		} else {
			rule.context.Report(rule.context.Range(node), diagnostics.Unsafe_usage_of_optional_chaining_If_it_short_circuits_with_undefined_the_evaluation_will_throw_TypeError)
		}
		return
	}
	switch node.Kind {
	case ast.KindBinaryExpression:
		expression := node.AsBinaryExpression()
		switch expression.OperatorToken.Kind {
		case ast.KindAmpersandAmpersandToken:
			rule.optionalShortCircuit(expression.Left, arithmetic)
			rule.optionalShortCircuit(expression.Right, arithmetic)
		case ast.KindBarBarToken, ast.KindQuestionQuestionToken, ast.KindCommaToken:
			rule.optionalShortCircuit(expression.Right, arithmetic)
		}
	case ast.KindConditionalExpression:
		rule.optionalShortCircuit(node.AsConditionalExpression().WhenTrue, arithmetic)
		rule.optionalShortCircuit(node.AsConditionalExpression().WhenFalse, arithmetic)
	case ast.KindAwaitExpression:
		rule.optionalShortCircuit(node.Expression(), arithmetic)
	}
}

func optionalChainDestructuringPattern(node *ast.Node) bool {
	if node == nil {
		return false
	}
	node = ast.SkipParentheses(node)
	return node.Kind == ast.KindArrayBindingPattern || node.Kind == ast.KindObjectBindingPattern || node.Kind == ast.KindArrayLiteralExpression || node.Kind == ast.KindObjectLiteralExpression
}
