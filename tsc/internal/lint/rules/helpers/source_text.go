package helpers

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

func SemanticSourceText(context Context, node *ast.Node) string {
	if node == nil {
		return ""
	}
	return context.File.Text()[scanner.GetTokenPosOfNode(node, context.File, false):node.End()]
}

func SemanticTokenStart(context Context, node *ast.Node) int {
	return scanner.GetTokenPosOfNode(node, context.File, false)
}

func SemanticTextEdit(start, end int, text string) core.TextChange {
	return core.TextChange{TextRange: core.NewTextRange(start, end), NewText: text}
}
