package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
)

type noNegatedCondition struct {
	context Context
}

func (rule *noNegatedCondition) OnEnterNode(node *ast.Node) bool {
	var condition *ast.Node
	if node.Kind == ast.KindConditionalExpression {
		condition = node.AsConditionalExpression().Condition
	} else if node.Kind == ast.KindIfStatement {
		statement := node.AsIfStatement()
		if statement.ElseStatement != nil && statement.ElseStatement.Kind != ast.KindIfStatement {
			condition = statement.Expression
		}
	}
	if condition != nil {
		condition = ast.SkipParentheses(condition)
		if condition.Kind == ast.KindPrefixUnaryExpression && condition.AsPrefixUnaryExpression().Operator == ast.KindExclamationToken || condition.Kind == ast.KindBinaryExpression && (condition.AsBinaryExpression().OperatorToken.Kind == ast.KindExclamationEqualsToken || condition.AsBinaryExpression().OperatorToken.Kind == ast.KindExclamationEqualsEqualsToken) {
			rule.context.Report(rule.context.Range(node), diagnostics.Unexpected_negated_condition)
		}
	}
	return true
}

func (rule *noNegatedCondition) OnExitNode(node *ast.Node) {}

func newNoNegatedCondition(context Context) Rule { return &noNegatedCondition{context: context} }
