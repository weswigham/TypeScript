package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type noThrowLiteral struct {
	context Context
}

func newNoThrowLiteral(context Context) Rule {
	rule := &noThrowLiteral{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindThrowStatement},
	}
}

func (rule *noThrowLiteral) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindThrowStatement && node.Expression() != nil {
		expression := ast.SkipParentheses(node.Expression())
		if !helpers.ExpressionCouldBeError(expression) {
			rule.context.Report(rule.context.Range(node), diagnostics.Expected_an_error_object_to_be_thrown)
		} else if expression.Kind == ast.KindIdentifier && expression.Text() == "undefined" && helpers.StatementBuiltin(rule.context, expression, true) {
			rule.context.Report(rule.context.Range(node), diagnostics.Do_not_throw_undefined)
		}
	}
	return true
}
