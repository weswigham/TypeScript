package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type maxLinesPerFunctionRule struct {
	context Context
}

func newMaxLinesPerFunction(context Context) Rule {
	rule := &maxLinesPerFunctionRule{context: context}

	return Rule{
		Enter: rule.OnEnterNode,
		EnterKinds: []ast.Kind{
			ast.KindFunctionDeclaration,
			ast.KindFunctionExpression,
			ast.KindArrowFunction,
			ast.KindMethodDeclaration,
			ast.KindGetAccessor,
			ast.KindSetAccessor,
			ast.KindConstructor,
		},
	}
}

func (rule *maxLinesPerFunctionRule) OnEnterNode(node *ast.Node) bool {
	if !helpers.FunctionHasBody(node) {
		return true
	}
	expression := node
	for expression.Parent != nil && expression.Parent.Kind == ast.KindParenthesizedExpression {
		expression = expression.Parent
	}
	if !helpers.BooleanOptionValue(helpers.SyntaxObject(rule.context, 0), "IIFEs", false) && (node.Kind == ast.KindFunctionExpression || node.Kind == ast.KindArrowFunction) && expression.Parent != nil && expression.Parent.Kind == ast.KindCallExpression && expression.Parent.Expression() == expression {
		return true
	}
	count := helpers.SyntaxLineCount(rule.context, node, helpers.BooleanOptionValue(helpers.SyntaxObject(rule.context, 0), "skipComments", false), helpers.BooleanOptionValue(helpers.SyntaxObject(rule.context, 0), "skipBlankLines", false))
	if maximum := helpers.SyntaxMaximum(rule.context, 50); count > maximum {
		rule.context.Report(rule.context.Range(node), diagnostics.X_0_has_too_many_lines_1_Maximum_allowed_is_2, helpers.CapitalizeFirstRune(helpers.FunctionDiagnosticName(node)), count, maximum)
	}
	return true
}
