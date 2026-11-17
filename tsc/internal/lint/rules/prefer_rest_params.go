package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type preferRestParamsRule struct{ context Context }

func newPreferRestParamsRule(context Context) Rule {
	return &preferRestParamsRule{context: context}
}

func (rule *preferRestParamsRule) OnEnterNode(node *ast.Node) bool {
	rule.restParameters(node)
	return true
}

func (rule *preferRestParamsRule) OnExitNode(node *ast.Node) {}

func (rule *preferRestParamsRule) restParameters(node *ast.Node) {
	if !helpers.SharedExpressionReference(node) || node.Text() != "arguments" {
		return
	}
	outer, parent := helpers.OuterParenthesizedNodeAndParent(node)
	if parent != nil && parent.Kind == ast.KindPropertyAccessExpression && parent.Expression() == outer {
		return
	}
	checker := rule.context.GetChecker()
	if !checker.IsArgumentsSymbol(checker.ResolveName("arguments", node, ast.SymbolFlagsValue, false)) {
		return
	}
	rule.context.Report(rule.context.Range(node), diagnostics.Use_the_rest_parameters_instead_of_arguments)
}
