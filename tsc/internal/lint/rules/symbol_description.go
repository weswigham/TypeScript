package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type symbolDescriptionRule struct{ context Context }

func newSymbolDescriptionRule(context Context) Rule {
	return &symbolDescriptionRule{context: context}
}

func (rule *symbolDescriptionRule) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindCallExpression {
		callee := ast.SkipParentheses(node.Expression())
		if callee.Kind == ast.KindIdentifier && callee.Text() == "Symbol" && len(node.Arguments()) == 0 && helpers.StatementBuiltin(rule.context, callee, true) {
			rule.context.Report(rule.context.Range(node), diagnostics.Expected_Symbol_to_have_a_description)
		}
	}
	return true
}

func (rule *symbolDescriptionRule) OnExitNode(node *ast.Node) {}
