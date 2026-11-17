package helpers

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
)

func TypescriptExecutableFunction(node *ast.Node) bool {
	switch node.Kind {
	case ast.KindFunctionDeclaration, ast.KindFunctionExpression, ast.KindArrowFunction:
		return true
	case ast.KindMethodDeclaration, ast.KindGetAccessor, ast.KindSetAccessor, ast.KindConstructor:
		return node.Body() != nil
	}
	return false
}

func TypescriptTypedFunctionParent(node *ast.Node, function *ast.Node) bool {
	if node == nil {
		return false
	}
	switch node.Kind {
	case ast.KindAsExpression, ast.KindTypeAssertionExpression:
		return true
	case ast.KindVariableDeclaration, ast.KindPropertyDeclaration, ast.KindParameter:
		return node.Type() != nil
	case ast.KindCallExpression:
		return node.Expression() != function
	case ast.KindJsxExpression, ast.KindJsxSpreadAttribute:
		return true
	}
	return false
}
