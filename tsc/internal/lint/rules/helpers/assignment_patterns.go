package helpers

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
)

func IsDestructuringAssignmentPattern(node *ast.Node) bool {
	outer := OuterParenthesizedExpression(node)
	parent := outer.Parent
	if parent == nil {
		return false
	}
	if parent.Kind == ast.KindBinaryExpression && parent.AsBinaryExpression().OperatorToken.Kind == ast.KindEqualsToken && parent.AsBinaryExpression().Left == outer {
		return true
	}
	if (parent.Kind == ast.KindForOfStatement || parent.Kind == ast.KindForInStatement) && parent.Initializer() == outer {
		return true
	}
	if parent.Kind == ast.KindArrayLiteralExpression || parent.Kind == ast.KindSpreadElement || parent.Kind == ast.KindPropertyAssignment {
		return IsDestructuringAssignmentPattern(parent)
	}
	if parent.Kind == ast.KindObjectLiteralExpression {
		return IsDestructuringAssignmentPattern(parent)
	}
	return false
}
