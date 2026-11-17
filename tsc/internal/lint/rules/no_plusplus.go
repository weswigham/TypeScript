package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type noPlusplus struct {
	context Context
}

func (rule *noPlusplus) OnEnterNode(node *ast.Node) bool {
	operator := ast.KindUnknown
	if node.Kind == ast.KindPrefixUnaryExpression {
		operator = node.AsPrefixUnaryExpression().Operator
	} else if node.Kind == ast.KindPostfixUnaryExpression {
		operator = node.AsPostfixUnaryExpression().Operator
	}
	if operator == ast.KindPlusPlusToken || operator == ast.KindMinusMinusToken {
		if helpers.BooleanRuleOption(rule.context, "allowForLoopAfterthoughts", false) && noPlusplusAfterthought(node) {
			return true
		}
		text := "++"
		if operator == ast.KindMinusMinusToken {
			text = "--"
		}
		rule.context.Report(rule.context.Range(node), diagnostics.Unary_operator_0_used, text)
	}
	return true
}

func (rule *noPlusplus) OnExitNode(node *ast.Node) {}

func noPlusplusAfterthought(node *ast.Node) bool {
	for {
		node = helpers.OuterParenthesizedExpression(node)
		if node.Parent == nil {
			return false
		}
		if helpers.IsCommaSequenceExpression(node.Parent) {
			node = node.Parent
			continue
		}
		return node.Parent.Kind == ast.KindForStatement && node.Parent.AsForStatement().Incrementor == node
	}
}

func newNoPlusplus(context Context) Rule { return &noPlusplus{context: context} }
