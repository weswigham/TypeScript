package helpers

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
)

func SemanticMemberAccessibility(node *ast.Node) string {
	if node.ModifierFlags()&ast.ModifierFlagsPrivate != 0 {
		return "private"
	}
	if node.ModifierFlags()&ast.ModifierFlagsProtected != 0 {
		return "protected"
	}
	if node.Name() != nil && node.Name().Kind == ast.KindPrivateIdentifier {
		return "#private"
	}
	return "public"
}
