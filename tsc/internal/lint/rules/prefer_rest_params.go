package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type preferRestParamsRule struct{ context Context }

func newPreferRestParamsRule(context Context) Rule {
	rule := &preferRestParamsRule{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindIdentifier},
	}
}

func (rule *preferRestParamsRule) OnEnterNode(node *ast.Node) bool {
	rule.restParameters(node)
	return true
}

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
