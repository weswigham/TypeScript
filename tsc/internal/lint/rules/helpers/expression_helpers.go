package helpers

import (
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/astnav"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

func IsDirectivePrologueStatement(node *ast.Node) bool {
	if node.Expression().Kind != ast.KindStringLiteral {
		return false
	}
	var statements []*ast.Node
	parent := node.Parent
	switch parent.Kind {
	case ast.KindSourceFile:
		statements = parent.AsSourceFile().Statements.Nodes
	case ast.KindModuleBlock:
		statements = parent.AsModuleBlock().Statements.Nodes
	case ast.KindBlock:
		if parent.Parent == nil || !ast.IsFunctionLike(parent.Parent) || parent.Parent.Body() != parent {
			return false
		}
		statements = parent.AsBlock().Statements.Nodes
	default:
		return false
	}
	for _, statement := range statements {
		if statement.Kind != ast.KindExpressionStatement || statement.Expression().Kind != ast.KindStringLiteral {
			return false
		}
		if statement == node {
			return true
		}
	}
	return false
}

func IsDestructuringAssignmentTarget(node *ast.Node) bool {
	for node.Parent != nil {
		parent := node.Parent
		switch parent.Kind {
		case ast.KindParenthesizedExpression, ast.KindArrayLiteralExpression, ast.KindObjectLiteralExpression, ast.KindPropertyAssignment, ast.KindSpreadAssignment, ast.KindSpreadElement:
			node = parent
		case ast.KindBinaryExpression:
			expression := parent.AsBinaryExpression()
			return expression.OperatorToken.Kind == ast.KindEqualsToken && expression.Left == node
		case ast.KindForInStatement, ast.KindForOfStatement:
			return parent.Initializer() == node
		default:
			return false
		}
	}
	return false
}

func IsECMAScriptWhitespace(character rune) bool {
	return character == '\t' || character == '\n' || character == '\v' || character == '\f' || character == '\r' || character == ' ' || character == '\u00a0' || character == '\u1680' || character >= '\u2000' && character <= '\u200a' || character == '\u2028' || character == '\u2029' || character == '\u202f' || character == '\u205f' || character == '\u3000' || character == '\ufeff'
}

func ExpressionBooleanOption(context Context, name string, fallback bool) bool {
	if len(context.Options) > 0 {
		if options, ok := context.Options[0].(map[string]any); ok {
			if value, ok := options[name].(bool); ok {
				return value
			}
		}
	}
	return fallback
}

func HasSourceCommentBetween(context Context, start int, end int) bool {
	lexer := scanner.NewScanner()
	lexer.SetText(context.File.Text()[start:end])
	lexer.SetSkipTrivia(false)
	for kind := lexer.Scan(); kind != ast.KindEndOfFile; kind = lexer.Scan() {
		if kind == ast.KindSingleLineCommentTrivia || kind == ast.KindMultiLineCommentTrivia {
			return true
		}
	}
	return false
}

func ReportAfterLineBreak(context Context, start int, end int, message *diagnostics.Message) {
	previous := astnav.FindPrecedingToken(context.File, start)
	if previous != nil && strings.ContainsAny(context.File.Text()[previous.End():start], "\r\n\u2028\u2029") {
		context.Report(core.NewTextRange(start, end), message)
	}
}
