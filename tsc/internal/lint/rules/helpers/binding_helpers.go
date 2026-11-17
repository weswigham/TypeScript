package helpers

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
)

func SharedValueReference(node *ast.Node) bool {
	if node.Kind != ast.KindIdentifier || node.Parent == nil {
		return false
	}
	if node.Parent.Kind == ast.KindPropertyAccessExpression {
		return node.Parent.Expression() == node
	}
	if node.Parent.Kind == ast.KindShorthandPropertyAssignment {
		return true
	}
	return ast.IsInExpressionContext(node)
}

func SharedBindingReference(node *ast.Node) bool {
	if node.Kind == ast.KindIdentifier && node.Parent != nil && node.Parent.Kind == ast.KindShorthandPropertyAssignment {
		return true
	}
	if node.Kind != ast.KindIdentifier || ast.IsDeclarationNameOrImportPropertyName(node) || ast.IsPartOfTypeNode(node) {
		return false
	}
	parent := node.Parent
	if parent == nil {
		return false
	}
	switch parent.Kind {
	case ast.KindPropertyAccessExpression, ast.KindQualifiedName:
		return parent.Name() != node
	case ast.KindPropertyAssignment, ast.KindMethodDeclaration, ast.KindPropertyDeclaration:
		return parent.Name() != node
	case ast.KindLabeledStatement, ast.KindBreakStatement, ast.KindContinueStatement, ast.KindImportSpecifier, ast.KindNamespaceImport, ast.KindImportClause:
		return false
	}
	return true
}

func SharedBindingSymbol(context Context, node *ast.Node) *ast.Symbol {
	if node.Parent != nil && node.Parent.Kind == ast.KindShorthandPropertyAssignment && node.Parent.Name() == node {
		return context.GetChecker().GetShorthandAssignmentValueSymbol(node.Parent)
	}
	return context.GetChecker().GetSymbolAtLocation(node)
}

func SharedBindingReferences(context Context, referencesBySymbol *map[*ast.Symbol][]*ast.Node, symbol *ast.Symbol) []*ast.Node {
	if (*referencesBySymbol) == nil {
		(*referencesBySymbol) = make(map[*ast.Symbol][]*ast.Node)
		var visit func(*ast.Node) bool
		visit = func(node *ast.Node) bool {
			if SharedBindingReference(node) {
				if referencedSymbol := SharedBindingSymbol(context, node); referencedSymbol != nil {
					(*referencesBySymbol)[referencedSymbol] = append((*referencesBySymbol)[referencedSymbol], node)
				}
			}
			node.ForEachChild(visit)
			return false
		}
		visit(context.File.AsNode())
	}
	return (*referencesBySymbol)[symbol]
}
