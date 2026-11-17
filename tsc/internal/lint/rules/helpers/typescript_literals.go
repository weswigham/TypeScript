package helpers

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
)

func TypescriptEnumLiteral(node *ast.Node) bool {
	return node.Kind == ast.KindStringLiteral || node.Kind == ast.KindNumericLiteral || node.Kind == ast.KindBigIntLiteral || node.Kind == ast.KindRegularExpressionLiteral || node.Kind == ast.KindTrueKeyword || node.Kind == ast.KindFalseKeyword || node.Kind == ast.KindNullKeyword
}
