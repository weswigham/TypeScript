package helpers

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
)

func OuterParenthesizedExpression(node *ast.Node) *ast.Node {
	for node.Parent != nil && node.Parent.Kind == ast.KindParenthesizedExpression {
		node = node.Parent
	}
	return node
}
