package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type noSequences struct {
	context Context
}

func (rule *noSequences) OnEnterNode(node *ast.Node) bool {
	if helpers.IsCommaSequenceExpression(node) && !(node.Parent != nil && helpers.IsCommaSequenceExpression(node.Parent)) {
		outer := helpers.OuterParenthesizedExpression(node)
		parent := outer.Parent
		if parent != nil && parent.Kind == ast.KindForStatement && (parent.Initializer() == outer || parent.AsForStatement().Incrementor == outer) {
			return true
		}
		if helpers.BooleanRuleOption(rule.context, "allowInParentheses", true) && node.Parent != nil && node.Parent.Kind == ast.KindParenthesizedExpression {
			requiresTwo := parent != nil && parent.Kind == ast.KindArrowFunction && parent.Body() == outer
			if !requiresTwo || node.Parent.Parent != nil && node.Parent.Parent.Kind == ast.KindParenthesizedExpression {
				return true
			}
		}
		first := node
		for helpers.IsCommaSequenceExpression(first.AsBinaryExpression().Left) {
			first = first.AsBinaryExpression().Left
		}
		rule.context.Report(rule.context.Range(first.AsBinaryExpression().OperatorToken), diagnostics.Unexpected_use_of_comma_operator)
	}
	return true
}

func (rule *noSequences) OnExitNode(node *ast.Node) {}

func newNoSequences(context Context) Rule { return &noSequences{context: context} }
