package helpers

import (
	"math/big"
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

func SourceNodeText(context Context, node *ast.Node) string {
	return scanner.GetSourceTextOfNodeFromSourceFile(context.File, node, false)
}

func SourceEmptyText(context Context, node *ast.Node) bool {
	text := SourceNodeText(context, node)
	return len(text) >= 2 && !ContainsCommentTrivia(text[1:len(text)-1])
}

func IsEmptyCommentFreeBlock(context Context, body *ast.Node) bool {
	return body != nil && body.Kind == ast.KindBlock && len(body.AsBlock().Statements.Nodes) == 0 && SourceEmptyText(context, body)
}

func OuterParenthesizedNodeAndParent(node *ast.Node) (*ast.Node, *ast.Node) {
	for node.Parent != nil && node.Parent.Kind == ast.KindParenthesizedExpression {
		node = node.Parent
	}
	return node, node.Parent
}

func SourceAssignment(node *ast.Node) bool {
	return node.Kind == ast.KindBinaryExpression && ast.IsAssignmentOperator(node.AsBinaryExpression().OperatorToken.Kind)
}

func SourceJumpLabel(node *ast.Node) *ast.Node {
	if node.Kind == ast.KindBreakStatement {
		return node.AsBreakStatement().Label
	}
	return node.AsContinueStatement().Label
}

func StaticPropertyNameText(name *ast.Node) (string, bool) {
	if name == nil || name.Kind == ast.KindPrivateIdentifier {
		return "", false
	}
	if name.Kind == ast.KindComputedPropertyName {
		name = ast.SkipParentheses(name.Expression())
		if name.Kind != ast.KindStringLiteral && name.Kind != ast.KindNumericLiteral && name.Kind != ast.KindBigIntLiteral && name.Kind != ast.KindNoSubstitutionTemplateLiteral && name.Kind != ast.KindNullKeyword && name.Kind != ast.KindTrueKeyword && name.Kind != ast.KindFalseKeyword {
			return "", false
		}
	}
	switch name.Kind {
	case ast.KindIdentifier, ast.KindStringLiteral, ast.KindNumericLiteral, ast.KindNoSubstitutionTemplateLiteral:
		return name.Text(), true
	case ast.KindBigIntLiteral:
		if integer, ok := ParseBigIntLiteralValue(name.Text()); ok {
			return integer.String(), true
		}
	case ast.KindNullKeyword, ast.KindTrueKeyword, ast.KindFalseKeyword:
		return scanner.TokenToString(name.Kind), true
	}
	return "", false
}

func ParseBigIntLiteralValue(text string) (*big.Int, bool) {
	text = strings.ReplaceAll(strings.TrimSuffix(text, "n"), "_", "")
	integer, ok := new(big.Int).SetString(text, 0)
	if !ok {
		integer, ok = new(big.Int).SetString(text, 10)
	}
	return integer, ok
}

func SourceDestructuring(node *ast.Node) bool {
	for {
		outer, parent := OuterParenthesizedNodeAndParent(node)
		if parent == nil {
			return false
		}
		if SourceAssignment(parent) && parent.AsBinaryExpression().Left == outer || (parent.Kind == ast.KindForInStatement || parent.Kind == ast.KindForOfStatement) && parent.Initializer() == outer {
			return true
		}
		switch parent.Kind {
		case ast.KindPropertyAssignment, ast.KindSpreadAssignment, ast.KindSpreadElement, ast.KindObjectLiteralExpression, ast.KindArrayLiteralExpression:
			node = parent
		default:
			return false
		}
	}
}

func ContainsCommentTrivia(text string) bool {
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
