package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type maxNestedCallbacksRule struct {
	context Context
}

func (rule *maxNestedCallbacksRule) OnEnterNode(node *ast.Node) bool {
	constructors := helpers.BooleanOptionValue(helpers.SyntaxObject(rule.context, 0), "checkConstructorCallCallbacks", false)
	if !maxNestedCallbacksCallback(node, constructors) {
		return true
	}
	depth := 1
	for parent := node.Parent; parent != nil; parent = parent.Parent {
		if maxNestedCallbacksCallback(parent, constructors) {
			depth++
		}
	}
	if maximum := helpers.SyntaxMaximum(rule.context, 10); depth > maximum {
		rule.context.Report(rule.context.Range(node), diagnostics.Too_many_nested_callbacks_0_Maximum_allowed_is_1, depth, maximum)
	}
	return true
}

func (rule *maxNestedCallbacksRule) OnExitNode(node *ast.Node) {
}

func maxNestedCallbacksCallback(node *ast.Node, constructors bool) bool {
	if node.Kind != ast.KindFunctionExpression && node.Kind != ast.KindArrowFunction {
		return false
	}
	expression := node
	for expression.Parent != nil && expression.Parent.Kind == ast.KindParenthesizedExpression {
		expression = expression.Parent
	}
	parent := expression.Parent
	return parent != nil && (parent.Kind == ast.KindCallExpression || constructors && parent.Kind == ast.KindNewExpression) && parent.Expression() != expression
}

func newMaxNestedCallbacks(context Context) Rule {
	return &maxNestedCallbacksRule{context: context}
}
