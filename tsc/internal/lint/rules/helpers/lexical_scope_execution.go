package helpers

import "github.com/microsoft/TypeScript/tsc/internal/ast"

func LexicalScopeUnwrap(node *ast.Node) *ast.Node {
	for node.Parent != nil && node.Parent.Kind == ast.KindParenthesizedExpression {
		node = node.Parent
	}
	return node
}

func LexicalScopeExecution(node *ast.Node) *ast.Node {
	for current := node.Parent; current != nil; current = current.Parent {
		if ast.IsFunctionLike(current) && !TsScopeContains(current.Name(), node) || current.Kind == ast.KindSourceFile || current.Kind == ast.KindClassStaticBlockDeclaration || current.Kind == ast.KindPropertyDeclaration && TsScopeContains(current.Initializer(), node) {
			return current
		}
	}
	return nil
}
