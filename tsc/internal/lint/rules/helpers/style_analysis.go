package helpers

import (
	"slices"
	"strings"
	"unicode/utf16"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
)

func StyleCompare(left, right string) int {
	return slices.Compare(utf16.Encode([]rune(left)), utf16.Encode([]rune(right)))
}

func StyleLines(text string) int {
	return strings.Count(text, "\n") + strings.Count(strings.ReplaceAll(text, "\r\n", ""), "\r") + strings.Count(text, "\u2028") + strings.Count(text, "\u2029")
}

func StyleFunction(node *ast.Node) bool {
	return ast.IsFunctionLike(node) && node.Body() != nil
}
