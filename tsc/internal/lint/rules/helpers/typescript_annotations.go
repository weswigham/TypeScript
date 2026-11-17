package helpers

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/ls/change"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

func TsAnnotationColon(context Context, node *ast.Node) int {
	tokenScanner := scanner.NewScanner()
	tokenScanner.SetText(context.File.Text())
	tokenScanner.ResetPos(node.Name().End())
	for tokenScanner.Scan() != ast.KindEndOfFile {
		if tokenScanner.Token() == ast.KindColonToken {
			return tokenScanner.TokenStart()
		}
		if tokenScanner.TokenStart() >= node.Type().End() {
			break
		}
	}
	return -1
}

func TsAConstAssertion(typeNode *ast.Node) bool {
	return typeNode != nil && typeNode.Kind == ast.KindTypeReference && typeNode.AsTypeReferenceNode().TypeName.Kind == ast.KindIdentifier && typeNode.AsTypeReferenceNode().TypeName.Text() == "const"
}

func typescriptInsertText(tracker *change.Tracker, file *ast.SourceFile, position int, text string) {
	tracker.ReplaceTextRangeWithText(file, core.NewTextRange(position, position), text)
}
