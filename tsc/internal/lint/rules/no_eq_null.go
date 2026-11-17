package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
)

type noEqNull struct {
	context Context
}

func newNoEqNull(context Context) Rule { return &noEqNull{context: context} }

func (rule *noEqNull) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindBinaryExpression {
		binary := node.AsBinaryExpression()
		if (binary.OperatorToken.Kind == ast.KindEqualsEqualsToken || binary.OperatorToken.Kind == ast.KindExclamationEqualsToken) && (ast.SkipParentheses(binary.Left).Kind == ast.KindNullKeyword || ast.SkipParentheses(binary.Right).Kind == ast.KindNullKeyword) {
			rule.context.Report(rule.context.Range(node), diagnostics.Use_to_compare_with_null)
		}
	}

	return true
}

func (rule *noEqNull) OnExitNode(node *ast.Node) {
}
