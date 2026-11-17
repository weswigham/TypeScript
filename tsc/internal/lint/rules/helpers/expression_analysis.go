package helpers

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
)

func ExpressionComparison(kind ast.Kind) bool {
	switch kind {
	case ast.KindEqualsEqualsToken, ast.KindEqualsEqualsEqualsToken, ast.KindExclamationEqualsToken, ast.KindExclamationEqualsEqualsToken, ast.KindLessThanToken, ast.KindLessThanEqualsToken, ast.KindGreaterThanToken, ast.KindGreaterThanEqualsToken:
		return true
	}
	return false
}

func ExpressionSame(left, right *ast.Node, strict bool) bool {
	left, right = ast.SkipParentheses(left), ast.SkipParentheses(right)
	if !strict {
		return SameStaticReference(left, right)
	}
	if left.Kind != right.Kind {
		return false
	}
	if ast.IsAccessExpression(left) {
		if !ExpressionSame(left.Expression(), right.Expression(), strict) {
			return false
		}
		if left.Kind == ast.KindPropertyAccessExpression {
			return ExpressionSame(left.Name(), right.Name(), strict)
		}
		return ExpressionSame(left.AsElementAccessExpression().ArgumentExpression, right.AsElementAccessExpression().ArgumentExpression, strict)
	}
	return SameStaticReference(left, right)
}

func ExpressionLiteral(node *ast.Node) bool {
	node = ast.SkipParentheses(node)
	switch node.Kind {
	case ast.KindStringLiteral, ast.KindNumericLiteral, ast.KindBigIntLiteral, ast.KindRegularExpressionLiteral, ast.KindTrueKeyword, ast.KindFalseKeyword, ast.KindNullKeyword, ast.KindNoSubstitutionTemplateLiteral:
		return true
	}
	return false
}
