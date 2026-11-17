package helpers

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

func DeclarationBool(options map[string]any, name string, fallback bool) bool {
	if value, ok := options[name].(bool); ok {
		return value
	}
	return fallback
}

func DeclarationWalk(node *ast.Node, visit func(*ast.Node) bool) {
	if node != nil && visit(node) {
		node.ForEachChild(func(child *ast.Node) bool { DeclarationWalk(child, visit); return false })
	}
}

func DeclarationOuter(node *ast.Node) *ast.Node {
	for node.Parent != nil && node.Parent.Kind == ast.KindParenthesizedExpression {
		node = node.Parent
	}
	return node
}

func DeclarationReference(node *ast.Node) bool {
	if node.Kind != ast.KindIdentifier || node.Parent == nil || ast.IsPartOfTypeNode(node) {
		return false
	}
	parent := node.Parent
	if parent.Kind == ast.KindShorthandPropertyAssignment {
		return parent.Name() == node
	}
	if ast.IsDeclarationNameOrImportPropertyName(node) {
		return false
	}
	switch parent.Kind {
	case ast.KindPropertyAccessExpression, ast.KindQualifiedName, ast.KindPropertyAssignment, ast.KindBindingElement:
		return parent.Name() != node && (parent.Kind != ast.KindBindingElement || parent.AsBindingElement().PropertyName != node)
	case ast.KindLabeledStatement, ast.KindBreakStatement, ast.KindContinueStatement:
		return false
	}
	return true
}

func DeclarationBindings(name *ast.Node) []*ast.Node {
	if name.Kind == ast.KindIdentifier {
		return []*ast.Node{name}
	}
	var result []*ast.Node
	DeclarationWalk(name, func(node *ast.Node) bool {
		if node.Kind == ast.KindBindingElement {
			result = append(result, DeclarationBindings(node.Name())...)
			return false
		}
		return true
	})
	return result
}

func DeclarationScope(node *ast.Node, functionOnly bool) *ast.Node {
	for current := node.Parent; current != nil; current = current.Parent {
		if ast.IsFunctionLike(current) || current.Kind == ast.KindSourceFile || current.Kind == ast.KindModuleBlock || current.Kind == ast.KindClassStaticBlockDeclaration {
			return current
		}
		if !functionOnly {
			switch current.Kind {
			case ast.KindBlock:
				if current.Parent != nil && ast.IsFunctionLike(current.Parent) {
					return current.Parent
				}
				return current
			case ast.KindCaseBlock, ast.KindForStatement, ast.KindForInStatement, ast.KindForOfStatement, ast.KindCatchClause:
				return current
			}
		}
	}
	return nil
}

func DeclarationContains(container, node *ast.Node) bool {
	return container != nil && node.Pos() >= container.Pos() && node.End() <= container.End()
}

func DeclarationComment(text string) bool {
	lexer := scanner.NewScanner()
	lexer.SetText(text)
	lexer.SetSkipTrivia(false)
	for token := lexer.Scan(); token != ast.KindEndOfFile; token = lexer.Scan() {
		if token == ast.KindSingleLineCommentTrivia || token == ast.KindMultiLineCommentTrivia {
			return true
		}
	}
	return false
}

type DeclarationToken struct {
	Kind       ast.Kind
	Start, End int
}

func DeclarationProperty(node *ast.Node) string {
	if node == nil {
		return ""
	}
	if node.Kind == ast.KindComputedPropertyName {
		node = ast.SkipParentheses(node.AsComputedPropertyName().Expression)
		if node.Kind != ast.KindStringLiteral && node.Kind != ast.KindNumericLiteral && node.Kind != ast.KindNoSubstitutionTemplateLiteral {
			return ""
		}
	}
	switch node.Kind {
	case ast.KindIdentifier, ast.KindStringLiteral, ast.KindNumericLiteral, ast.KindNoSubstitutionTemplateLiteral:
		return node.Text()
	}
	return ""
}

func DeclarationAccess(node *ast.Node) (*ast.Node, *ast.Node) {
	switch node.Kind {
	case ast.KindPropertyAccessExpression:
		return node.Expression(), node.Name()
	case ast.KindElementAccessExpression:
		return node.Expression(), node.AsElementAccessExpression().ArgumentExpression
	}
	return nil, nil
}
