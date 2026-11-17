package helpers

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/jsnum"
)

func SharedParenthesizedOuter(node *ast.Node) *ast.Node {
	for node.Parent != nil && node.Parent.Kind == ast.KindParenthesizedExpression {
		node = node.Parent
	}
	return node
}

func SharedNumericLiteralEquals(node *ast.Node, value jsnum.Number) bool {
	node = ast.SkipParentheses(node)
	return node.Kind == ast.KindNumericLiteral && jsnum.FromString(node.Text()) == value
}

func SharedExpressionReference(node *ast.Node) bool {
	if node.Kind != ast.KindIdentifier || node.Parent == nil {
		return false
	}
	parent := node.Parent
	if parent.Kind == ast.KindPropertyAccessExpression && parent.Name() == node || parent.Kind == ast.KindMetaProperty || parent.Kind == ast.KindJsxAttribute {
		return false
	}
	if parent.Kind == ast.KindShorthandPropertyAssignment && parent.Name() == node {
		return true
	}
	return ast.IsInExpressionContext(node) && !ast.IsDeclarationName(node)
}

func SharedOptionalChainBoundary(node *ast.Node) bool {
	return node.Kind == ast.KindParenthesizedExpression && ast.SkipParentheses(node).Flags&ast.NodeFlagsOptionalChain != 0
}
