package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type noPrototypeBuiltinsRule struct{ context Context }

func newNoPrototypeBuiltinsRule(context Context) Rule {
	return &noPrototypeBuiltinsRule{context: context}
}

func (rule *noPrototypeBuiltinsRule) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindCallExpression {
		callee := ast.SkipParentheses(node.Expression())
		name := helpers.StatementPropertyName(callee)
		if name == "hasOwnProperty" || name == "isPrototypeOf" || name == "propertyIsEnumerable" {
			property := callee.Name()
			if callee.Kind == ast.KindElementAccessExpression {
				property = callee.AsElementAccessExpression().ArgumentExpression
			}
			rule.context.Report(rule.context.Range(property), diagnostics.Do_not_access_Object_prototype_method_0_from_target_object, name)
		}
	}
	return true
}

func (rule *noPrototypeBuiltinsRule) OnExitNode(node *ast.Node) {}
