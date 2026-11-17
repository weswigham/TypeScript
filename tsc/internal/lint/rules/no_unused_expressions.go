package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type noUnusedExpressionsCoreRule struct {
	context              Context
	allowShortCircuit    bool
	allowTernary         bool
	allowTaggedTemplates bool
	enforceForJSX        bool
}

func newNoUnusedExpressionsCoreRule(context Context) *noUnusedExpressionsCoreRule {
	return &noUnusedExpressionsCoreRule{
		context:              context,
		allowShortCircuit:    helpers.ExpressionBooleanOption(context, "allowShortCircuit", false),
		allowTernary:         helpers.ExpressionBooleanOption(context, "allowTernary", false),
		allowTaggedTemplates: helpers.ExpressionBooleanOption(context, "allowTaggedTemplates", false),
		enforceForJSX:        helpers.ExpressionBooleanOption(context, "enforceForJSX", false),
	}
}

func (rule *noUnusedExpressionsCoreRule) OnEnterNode(node *ast.Node) bool {
	rule.checkUnused(node)
	return true
}

func (rule *noUnusedExpressionsCoreRule) OnExitNode(node *ast.Node) {}

func (rule *noUnusedExpressionsCoreRule) checkUnused(node *ast.Node) {
	if node.Kind == ast.KindExpressionStatement && rule.unusedExpression(node.Expression()) && !helpers.IsDirectivePrologueStatement(node) {
		rule.context.Report(rule.context.Range(node), diagnostics.Expected_an_assignment_or_function_call_and_instead_saw_an_expression)
	}
}

func (rule *noUnusedExpressionsCoreRule) unusedExpression(node *ast.Node) bool {
	node = ast.SkipParentheses(node)
	switch node.Kind {
	case ast.KindAsExpression, ast.KindTypeAssertionExpression, ast.KindNonNullExpression, ast.KindExpressionWithTypeArguments:
		return rule.unusedExpression(node.Expression())
	case ast.KindArrayLiteralExpression, ast.KindArrowFunction, ast.KindClassExpression, ast.KindFunctionExpression,
		ast.KindIdentifier, ast.KindPropertyAccessExpression, ast.KindElementAccessExpression, ast.KindMetaProperty,
		ast.KindObjectLiteralExpression, ast.KindStringLiteral, ast.KindNumericLiteral, ast.KindBigIntLiteral,
		ast.KindRegularExpressionLiteral, ast.KindNullKeyword, ast.KindTrueKeyword, ast.KindFalseKeyword,
		ast.KindTemplateExpression, ast.KindNoSubstitutionTemplateLiteral, ast.KindThisKeyword,
		ast.KindTypeOfExpression:
		return true
	case ast.KindBinaryExpression:
		expression := node.AsBinaryExpression()
		operator := expression.OperatorToken.Kind
		if ast.IsAssignmentOperator(operator) {
			return false
		}
		if operator == ast.KindAmpersandAmpersandToken || operator == ast.KindBarBarToken || operator == ast.KindQuestionQuestionToken {
			return !rule.allowShortCircuit || rule.unusedExpression(expression.Right)
		}
		return true
	case ast.KindConditionalExpression:
		expression := node.AsConditionalExpression()
		return !rule.allowTernary || rule.unusedExpression(expression.WhenTrue) || rule.unusedExpression(expression.WhenFalse)
	case ast.KindTaggedTemplateExpression:
		return !rule.allowTaggedTemplates
	case ast.KindJsxElement, ast.KindJsxSelfClosingElement, ast.KindJsxFragment:
		return rule.enforceForJSX
	case ast.KindPrefixUnaryExpression:
		operator := node.AsPrefixUnaryExpression().Operator
		return operator != ast.KindPlusPlusToken && operator != ast.KindMinusMinusToken
	}
	return false
}

func newNoUnusedExpressionsCore(context Context) Rule { return newNoUnusedExpressionsCoreRule(context) }
