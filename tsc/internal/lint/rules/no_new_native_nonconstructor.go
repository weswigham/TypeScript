package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type noNewNativeNonconstructorRule struct{ context Context }

func newNoNewNativeNonconstructorRule(context Context) Rule {
	return &noNewNativeNonconstructorRule{context: context}
}

func (rule *noNewNativeNonconstructorRule) OnEnterNode(node *ast.Node) bool {
	rule.checkConstructor(node)
	return true
}

func (rule *noNewNativeNonconstructorRule) OnExitNode(node *ast.Node) {}

func (rule *noNewNativeNonconstructorRule) checkConstructor(node *ast.Node) {
	if node.Kind != ast.KindNewExpression {
		return
	}
	callee := ast.SkipParentheses(node.Expression())
	if callee.Kind != ast.KindIdentifier || !helpers.StatementBuiltin(rule.context, callee, true) {
		return
	}
	if callee.Text() == "Symbol" || callee.Text() == "BigInt" {
		rule.context.Report(rule.context.Range(callee), diagnostics.X_0_cannot_be_called_as_a_constructor, callee.Text())
	}
}
