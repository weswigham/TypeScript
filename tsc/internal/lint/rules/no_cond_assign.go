package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
)

var noCondAssignMessage = diagnostics.Expected_a_conditional_expression_and_instead_saw_an_assignment

type noCondAssign struct {
	context Context
}

func (rule *noCondAssign) OnEnterNode(node *ast.Node) bool {
	var condition *ast.Node
	switch node.Kind {
	case ast.KindIfStatement:
		condition = node.AsIfStatement().Expression
	case ast.KindWhileStatement:
		condition = node.AsWhileStatement().Expression
	case ast.KindDoStatement:
		condition = node.AsDoStatement().Expression
	case ast.KindForStatement:
		condition = node.AsForStatement().Condition
	case ast.KindConditionalExpression:
		condition = node.AsConditionalExpression().Condition
		if condition.Kind == ast.KindParenthesizedExpression {
			condition = condition.AsParenthesizedExpression().Expression
		}
	}
	if condition != nil && ast.IsAssignmentExpression(condition, false) {
		rule.context.Report(rule.context.Range(condition), noCondAssignMessage)
	}
	return true
}

func (rule *noCondAssign) OnExitNode(node *ast.Node) {}

func newNoCondAssign(context Context) Rule { return &noCondAssign{context: context} }
