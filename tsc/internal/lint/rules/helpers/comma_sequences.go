package helpers

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
)

func IsCommaSequenceExpression(node *ast.Node) bool {
	return node.Kind == ast.KindBinaryExpression && node.AsBinaryExpression().OperatorToken.Kind == ast.KindCommaToken
}
