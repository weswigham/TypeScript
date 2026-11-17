package helpers

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/jsnum"
)

func SameStaticReference(left, right *ast.Node) bool {
	left, right = ast.SkipParentheses(left), ast.SkipParentheses(right)
	if ast.IsAccessExpression(left) && ast.IsAccessExpression(right) {
		if !SameStaticReference(left.Expression(), right.Expression()) {
			return false
		}
		if name, ok := StaticMemberNameText(left); ok {
			other, ok := StaticMemberNameText(right)
			return ok && name == other
		}
		if left.Kind != right.Kind {
			return false
		}
		if left.Kind == ast.KindPropertyAccessExpression {
			return SameStaticReference(left.Name(), right.Name())
		}
		return SameStaticReference(left.AsElementAccessExpression().ArgumentExpression, right.AsElementAccessExpression().ArgumentExpression)
	}
	if left.Kind != right.Kind {
		return false
	}
	switch left.Kind {
	case ast.KindThisKeyword, ast.KindSuperKeyword, ast.KindNullKeyword, ast.KindTrueKeyword, ast.KindFalseKeyword:
		return true
	case ast.KindIdentifier, ast.KindPrivateIdentifier, ast.KindStringLiteral, ast.KindBigIntLiteral, ast.KindRegularExpressionLiteral:
		return left.Text() == right.Text()
	case ast.KindNumericLiteral:
		return jsnum.FromString(left.Text()) == jsnum.FromString(right.Text())
	}
	return false
}
