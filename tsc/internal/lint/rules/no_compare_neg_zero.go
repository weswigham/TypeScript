package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/jsnum"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

var noCompareNegZeroMessage = diagnostics.Do_not_use_the_0_operator_to_compare_against_0

type noCompareNegZero struct {
	context Context
}

func (rule *noCompareNegZero) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindBinaryExpression {
		expression := node.AsBinaryExpression()
		switch expression.OperatorToken.Kind {
		case ast.KindGreaterThanToken, ast.KindGreaterThanEqualsToken, ast.KindLessThanToken, ast.KindLessThanEqualsToken,
			ast.KindEqualsEqualsToken, ast.KindEqualsEqualsEqualsToken, ast.KindExclamationEqualsToken, ast.KindExclamationEqualsEqualsToken:
			if isNegativeZeroLiteral(expression.Left) || isNegativeZeroLiteral(expression.Right) {
				rule.context.Report(rule.context.Range(node), noCompareNegZeroMessage, scanner.TokenToString(expression.OperatorToken.Kind))
			}
		}
	}
	return true
}

func (rule *noCompareNegZero) OnExitNode(node *ast.Node) {}

func isNegativeZeroLiteral(node *ast.Node) bool {
	node = ast.SkipParentheses(node)
	if node.Kind != ast.KindPrefixUnaryExpression || node.AsPrefixUnaryExpression().Operator != ast.KindMinusToken {
		return false
	}
	operand := ast.SkipParentheses(node.AsPrefixUnaryExpression().Operand)
	return operand.Kind == ast.KindNumericLiteral && jsnum.FromString(operand.Text()) == 0
}

func newNoCompareNegZero(context Context) Rule { return &noCompareNegZero{context: context} }
