package helpers

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
)

func ExpressionCouldBeError(node *ast.Node) bool {
	node = ast.SkipParentheses(node)
	switch node.Kind {
	case ast.KindIdentifier, ast.KindCallExpression, ast.KindNewExpression, ast.KindPropertyAccessExpression, ast.KindElementAccessExpression,
		ast.KindTaggedTemplateExpression, ast.KindYieldExpression, ast.KindAwaitExpression:
		return true
	case ast.KindBinaryExpression:
		expression := node.AsBinaryExpression()
		switch expression.OperatorToken.Kind {
		case ast.KindEqualsToken, ast.KindAmpersandAmpersandEqualsToken, ast.KindCommaToken, ast.KindAmpersandAmpersandToken:
			return ExpressionCouldBeError(expression.Right)
		case ast.KindBarBarEqualsToken, ast.KindQuestionQuestionEqualsToken, ast.KindBarBarToken, ast.KindQuestionQuestionToken:
			return ExpressionCouldBeError(expression.Left) || ExpressionCouldBeError(expression.Right)
		}
	case ast.KindConditionalExpression:
		expression := node.AsConditionalExpression()
		return ExpressionCouldBeError(expression.WhenTrue) || ExpressionCouldBeError(expression.WhenFalse)
	}
	return false
}
