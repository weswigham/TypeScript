package rules

import (
	"slices"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
)

type noDupeElseIf struct {
	context Context
}

func newNoDupeElseIf(context Context) Rule { return &noDupeElseIf{context: context} }

func (rule *noDupeElseIf) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindIfStatement {
		rule.duplicateCondition(node)
	}

	return true
}

func (rule *noDupeElseIf) OnExitNode(node *ast.Node) {
}

func (rule *noDupeElseIf) equalCondition(left, right *ast.Node) bool {
	left, right = ast.SkipParentheses(left), ast.SkipParentheses(right)
	if left.Kind != right.Kind {
		return false
	}
	if left.Kind == ast.KindBinaryExpression {
		first, second := left.AsBinaryExpression(), right.AsBinaryExpression()
		operator := first.OperatorToken.Kind
		if (operator == ast.KindBarBarToken || operator == ast.KindAmpersandAmpersandToken) && operator == second.OperatorToken.Kind {
			return rule.equalCondition(first.Left, second.Left) && rule.equalCondition(first.Right, second.Right) || rule.equalCondition(first.Left, second.Right) && rule.equalCondition(first.Right, second.Left)
		}
	}
	return slices.Equal(expressionCaseTokens(rule.context.File, left), expressionCaseTokens(rule.context.File, right))
}

func (rule *noDupeElseIf) duplicateCondition(node *ast.Node) {
	condition := ast.SkipParentheses(node.AsIfStatement().Expression)
	checks := []*ast.Node{condition}
	if condition.Kind == ast.KindBinaryExpression && condition.AsBinaryExpression().OperatorToken.Kind == ast.KindAmpersandAmpersandToken {
		checks = append(checks, duplicateElseIfTerms(condition, ast.KindAmpersandAmpersandToken)...)
	}
	remaining := make([][][]*ast.Node, len(checks))
	for index, check := range checks {
		for _, operand := range duplicateElseIfTerms(check, ast.KindBarBarToken) {
			remaining[index] = append(remaining[index], duplicateElseIfTerms(operand, ast.KindAmpersandAmpersandToken))
		}
	}
	for current := node; current.Parent != nil && current.Parent.Kind == ast.KindIfStatement && current.Parent.AsIfStatement().ElseStatement == current; {
		current = current.Parent
		previous := duplicateElseIfTerms(current.AsIfStatement().Expression, ast.KindBarBarToken)
		for index, operands := range remaining {
			remaining[index] = slices.DeleteFunc(operands, func(terms []*ast.Node) bool {
				return slices.ContainsFunc(previous, func(operand *ast.Node) bool {
					return !slices.ContainsFunc(duplicateElseIfTerms(operand, ast.KindAmpersandAmpersandToken), func(term *ast.Node) bool {
						return !slices.ContainsFunc(terms, func(other *ast.Node) bool { return rule.equalCondition(term, other) })
					})
				})
			})
			if len(remaining[index]) == 0 {
				rule.context.Report(rule.context.Range(node.AsIfStatement().Expression), diagnostics.This_branch_can_never_execute_Its_condition_is_a_duplicate_or_covered_by_previous_conditions_in_the_if_else_if_chain)
				return
			}
		}
	}
}

func duplicateElseIfTerms(node *ast.Node, operator ast.Kind) []*ast.Node {
	node = ast.SkipParentheses(node)
	if node.Kind == ast.KindBinaryExpression && node.AsBinaryExpression().OperatorToken.Kind == operator {
		binary := node.AsBinaryExpression()
		return append(duplicateElseIfTerms(binary.Left, operator), duplicateElseIfTerms(binary.Right, operator)...)
	}
	return []*ast.Node{node}
}
