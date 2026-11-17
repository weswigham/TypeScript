package helpers

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
)

func SharedScopeStrict(node *ast.Node) bool {
	for current := node; current != nil; current = current.Parent {
		if ast.IsClassLike(current) || current.Kind == ast.KindClassStaticBlockDeclaration || current.Kind == ast.KindSourceFile && ast.IsExternalModule(current.AsSourceFile()) {
			return true
		}
		var statements []*ast.Node
		if current.Kind == ast.KindSourceFile {
			statements = current.AsSourceFile().Statements.Nodes
		} else if ast.IsFunctionLike(current) && current.Body() != nil && current.Body().Kind == ast.KindBlock {
			statements = current.Body().AsBlock().Statements.Nodes
		}
		for _, statement := range statements {
			if statement.Kind != ast.KindExpressionStatement || statement.Expression().Kind != ast.KindStringLiteral {
				break
			}
			if statement.Expression().Text() == "use strict" {
				return true
			}
		}
	}
	return false
}
