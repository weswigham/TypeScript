package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

func controlFlowContainsYield(root *ast.Node) bool {
	var visit func(*ast.Node) bool
	visit = func(node *ast.Node) bool {
		if node != root && ast.IsFunctionLike(node) {
			return false
		}
		return node.Kind == ast.KindYieldExpression || node.ForEachChild(visit)
	}
	if root.Kind == ast.KindForStatement {
		statement := root.AsForStatement()
		return statement.Condition != nil && visit(statement.Condition) || statement.Incrementor != nil && visit(statement.Incrementor) || visit(statement.Statement)
	}
	return visit(root)
}

type noConstantCondition struct {
	helpers.SharedControlFlowContext
}

func (rule *noConstantCondition) OnEnterNode(node *ast.Node) bool {
	rule.constantCondition(node)
	return true
}

func (rule *noConstantCondition) OnExitNode(node *ast.Node) {}

func (rule *noConstantCondition) constantCondition(node *ast.Node) {
	var condition *ast.Node
	switch node.Kind {
	case ast.KindIfStatement:
		condition = node.AsIfStatement().Expression
	case ast.KindConditionalExpression:
		condition = node.AsConditionalExpression().Condition
	default:
		condition = helpers.ControlFlowLoopCondition(node)
		mode := rule.Options()["checkLoops"]
		if mode == false || mode == "none" {
			return
		}
		if condition != nil && node.Kind == ast.KindWhileStatement && ast.SkipParentheses(condition).Kind == ast.KindTrueKeyword && mode != true && mode != "all" {
			return
		}
		if condition != nil && controlFlowContainsYield(node) {
			return
		}
	}
	if condition != nil && (&noConstantBinaryExpression{context: rule.Context}).isConstant(condition, true) {
		rule.ReportOnce(condition, diagnostics.Unexpected_constant_condition)
	}
}

func newNoConstantCondition(context Context) Rule {
	return &noConstantCondition{Context: context}
}
