package rules

import (
	"unicode/utf8"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type consistentReturn struct{ helpers.ReturnRuleContext }

func newConsistentReturn(context Context) Rule {
	rule := &consistentReturn{Context: context}

	return Rule{
		Exit: rule.OnExitNode,
		ExitKinds: []ast.Kind{
			ast.KindFunctionDeclaration,
			ast.KindFunctionExpression,
			ast.KindArrowFunction,
			ast.KindMethodDeclaration,
			ast.KindGetAccessor,
			ast.KindSetAccessor,
			ast.KindConstructor,
			ast.KindSourceFile,
		},
		GetSuggestions: rule.Suggestions,
	}
}

func (rule *consistentReturn) OnExitNode(node *ast.Node) {
	if !helpers.ReturnFunction(node) && node.Kind != ast.KindSourceFile {
		return
	}
	returns, normal, _ := helpers.AnalyzeFunctionReturns(node)
	rule.consistent(node, returns, normal)
}

func (rule *consistentReturn) consistent(node *ast.Node, returns []*ast.Node, normal bool) {
	if len(returns) == 0 {
		return
	}
	value := func(statement *ast.Node) bool {
		expression := statement.Expression()
		if expression == nil {
			return false
		}
		expression = ast.SkipParentheses(expression)
		return !rule.Option("treatUndefinedAsUnspecified", false) || !(expression.Kind == ast.KindVoidExpression || expression.Kind == ast.KindIdentifier && expression.Text() == "undefined")
	}
	wantValue := value(returns[0])
	for _, statement := range returns[1:] {
		if value(statement) != wantValue {
			message := diagnostics.X_0_expected_no_return_value
			if wantValue {
				message = diagnostics.X_0_expected_a_return_value
			}
			rule.Context.Report(rule.Context.Range(statement), message, helpers.ReturnCapitalize(helpers.ReturnName(node)))
		}
	}
	constructor := node.Kind == ast.KindConstructor
	if (node.Kind == ast.KindFunctionDeclaration || node.Kind == ast.KindFunctionExpression) && node.Name() != nil {
		first, _ := utf8.DecodeRuneInString(node.Name().Text())
		constructor = first >= 'A' && first <= 'Z'
	}
	if wantValue && normal && !constructor {
		rule.Context.Report(rule.Head(node, true), diagnostics.Expected_to_return_a_value_at_the_end_of_0, helpers.ReturnName(node))
	}
}
