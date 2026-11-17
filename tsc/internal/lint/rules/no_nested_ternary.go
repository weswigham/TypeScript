package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
)

type noNestedTernary struct {
	context Context
}

func (rule *noNestedTernary) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindConditionalExpression {
		expression := node.AsConditionalExpression()
		if ast.SkipParentheses(expression.WhenTrue).Kind == ast.KindConditionalExpression || ast.SkipParentheses(expression.WhenFalse).Kind == ast.KindConditionalExpression {
			rule.context.Report(rule.context.Range(node), diagnostics.Do_not_nest_ternary_expressions)
		}
	}
	return true
}

func (rule *noNestedTernary) OnExitNode(node *ast.Node) {}

func newNoNestedTernary(context Context) Rule { return &noNestedTernary{context: context} }
