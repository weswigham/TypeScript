package helpers

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
)

func StatementPropertyName(node *ast.Node) string {
	switch node.Kind {
	case ast.KindPropertyAccessExpression:
		if node.Name().Kind == ast.KindIdentifier {
			return node.Name().Text()
		}
	case ast.KindElementAccessExpression:
		property := ast.SkipParentheses(node.AsElementAccessExpression().ArgumentExpression)
		if property != nil && (property.Kind == ast.KindStringLiteral || property.Kind == ast.KindNoSubstitutionTemplateLiteral) {
			return property.Text()
		}
	}
	return ""
}

func StatementBuiltin(context Context, identifier *ast.Node, requireDefinition bool) bool {
	typeChecker := context.GetChecker()
	if local := context.File.AsNode().Locals().Get(identifier.Text()); local != nil && local.Flags()&(ast.SymbolFlagsValue|ast.SymbolFlagsAlias) != 0 {
		return false
	}
	symbol := typeChecker.ResolveName(identifier.Text(), identifier, ast.SymbolFlagsValue, false)
	if symbol == nil {
		return !requireDefinition
	}
	for _, declaration := range symbol.Declarations() {
		if !typeChecker.IsLibSymbolForHoverVerbosity(declaration.Symbol()) {
			return false
		}
	}
	return true
}
