package helpers

import (
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

func FunctionHeadRange(context Context, node *ast.Node) core.TextRange {
	start := scanner.GetTokenPosOfNode(node, context.File, false)
	end := node.Body().Pos()
	if node.Kind == ast.KindArrowFunction {
		arrow := node.AsArrowFunction().EqualsGreaterThanToken
		start = scanner.GetTokenPosOfNode(arrow, context.File, false)
		end = arrow.End()
	} else if node.Parent != nil && ast.IsClassLike(node.Parent) || node.Kind == ast.KindMethodDeclaration || node.Kind == ast.KindGetAccessor || node.Kind == ast.KindSetAccessor {
		if node.Name() != nil {
			end = node.Name().End()
		}
	}
	return core.NewTextRange(start, max(start, end))
}

func SharedFunctionName(node *ast.Node) string {
	if node.Kind == ast.KindConstructor {
		return "constructor"
	}
	property := sharedFunctionProperty(node)
	var words []string
	if property != nil && ast.HasSyntacticModifier(property, ast.ModifierFlagsStatic) {
		words = append(words, "static")
	}
	private := property != nil && property.Name() != nil && property.Name().Kind == ast.KindPrivateIdentifier
	if private {
		words = append(words, "private")
	}
	if ast.HasSyntacticModifier(node, ast.ModifierFlagsAsync) {
		words = append(words, "async")
	}
	if node.BodyData() != nil && node.BodyData().AsteriskToken != nil {
		words = append(words, "generator")
	}
	switch node.Kind {
	case ast.KindGetAccessor:
		words = append(words, "getter")
	case ast.KindSetAccessor:
		words = append(words, "setter")
	default:
		if property != nil {
			words = append(words, "method")
		} else if node.Kind == ast.KindArrowFunction {
			words = append(words, "arrow", "function")
		} else {
			words = append(words, "function")
		}
	}
	if private {
		words = append(words, "#"+strings.TrimPrefix(property.Name().Text(), "#"))
	} else if property != nil {
		if name, known := StaticMemberNameText(property); known {
			words = append(words, "'"+name+"'")
		} else if node.Name() != nil && node.Name().Kind == ast.KindIdentifier && property != node {
			words = append(words, "'"+node.Name().Text()+"'")
		}
	} else if node.Name() != nil {
		words = append(words, "'"+node.Name().Text()+"'")
	}
	return strings.Join(words, " ")
}

func sharedFunctionProperty(node *ast.Node) *ast.Node {
	if node.Kind == ast.KindMethodDeclaration || ast.IsAccessor(node) {
		return node
	}
	outer := node
	for outer.Parent != nil && outer.Parent.Kind == ast.KindParenthesizedExpression {
		outer = outer.Parent
	}
	parent := outer.Parent
	if parent != nil && (parent.Kind == ast.KindPropertyAssignment || parent.Kind == ast.KindPropertyDeclaration) && parent.Initializer() == outer {
		return parent
	}
	return nil
}

func SharedFunctionHead(context Context, node *ast.Node) (int, int) {
	start := scanner.GetTokenPosOfNode(node, context.File, false)
	end := node.FunctionLikeData().Parameters.Pos() - 1
	if property := sharedFunctionProperty(node); property != nil {
		start = scanner.GetTokenPosOfNode(property, context.File, false)
		if node.Kind == ast.KindArrowFunction && len(node.Parameters()) == 1 && (end < 0 || context.File.Text()[end] != '(') {
			end = scanner.GetTokenPosOfNode(node.Parameters()[0], context.File, false)
		}
	} else if node.Kind == ast.KindArrowFunction {
		arrow := node.AsArrowFunction().EqualsGreaterThanToken
		start, end = scanner.GetTokenPosOfNode(arrow, context.File, false), arrow.End()
	} else if node.Kind == ast.KindFunctionDeclaration && ast.HasSyntacticModifier(node, ast.ModifierFlagsDefault) {
		lexer := scanner.NewScanner()
		lexer.SetText(context.File.Text()[start:node.End()])
		lexer.SetSkipTrivia(true)
		for kind := lexer.Scan(); kind != ast.KindEndOfFile; kind = lexer.Scan() {
			if kind == ast.KindAsyncKeyword || kind == ast.KindFunctionKeyword {
				start += lexer.TokenStart()
				break
			}
		}
	}
	return start, end
}
