package rules

import (
	"slices"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type noBitwise struct {
	context Context
}

func newNoBitwise(context Context) Rule {
	rule := &noBitwise{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindBinaryExpression, ast.KindPrefixUnaryExpression},
	}
}

func (rule *noBitwise) OnEnterNode(node *ast.Node) bool {
	operator := ast.KindUnknown
	if node.Kind == ast.KindBinaryExpression {
		operator = node.AsBinaryExpression().OperatorToken.Kind
	} else if node.Kind == ast.KindPrefixUnaryExpression {
		operator = node.AsPrefixUnaryExpression().Operator
	}
	text := scanner.TokenToString(operator)
	if slices.Contains([]string{"^", "|", "&", "<<", ">>", ">>>", "^=", "|=", "&=", "<<=", ">>=", ">>>=", "~"}, text) && !rule.allow(text) {
		if operator == ast.KindBarToken && rule.Boolean("int32Hint") {
			right := ast.SkipParentheses(node.AsBinaryExpression().Right)
			if right.Kind == ast.KindNumericLiteral && right.Text() == "0" {
				return true
			}
		}
		rule.context.Report(rule.context.Range(node), diagnostics.Unexpected_use_of_0, text)
	}

	return true
}

func (rule *noBitwise) Options() map[string]any {
	if len(rule.context.Options) > 0 {
		options, _ := rule.context.Options[0].(map[string]any)
		return options
	}
	return nil
}

func (rule *noBitwise) Boolean(name string) bool {
	value, _ := rule.Options()[name].(bool)
	return value
}

func (rule *noBitwise) allow(name string) bool {
	values, _ := rule.Options()["allow"].([]any)
	return slices.Contains(values, any(name))
}
