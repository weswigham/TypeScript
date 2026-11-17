package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type funcStyleRule struct {
	context Context
}

func (rule *funcStyleRule) OnEnterNode(node *ast.Node) bool {
	options := helpers.SyntaxObject(rule.context, 1)
	style := helpers.StringOptionValue(helpers.SyntaxOption(rule.context, 0), "expression")
	if node.Kind == ast.KindFunctionDeclaration {
		if node.Body() == nil || ast.GetCombinedModifierFlags(node)&ast.ModifierFlagsDefault != 0 {
			return true
		}
		if ast.GetCombinedModifierFlags(node)&ast.ModifierFlagsExport != 0 {
			if overrides, ok := options["overrides"].(map[string]any); ok {
				style = helpers.StringOptionValue(overrides["namedExports"], style)
			}
		}
		if style != "expression" {
			return true
		}
		if node.Name() != nil {
			scope := node.Parent
			if scope.Kind == ast.KindCaseClause || scope.Kind == ast.KindDefaultClause {
				scope = scope.Parent
			}
			overloaded := false
			helpers.WalkSyntaxWhile(scope, func(child *ast.Node) bool {
				if child.Kind == ast.KindFunctionDeclaration && child.Name() != nil && child.Name().Text() == node.Name().Text() && child.Body() == nil {
					overloaded = true
				}
				return child == scope || child.Kind == ast.KindCaseClause || child.Kind == ast.KindDefaultClause
			})
			if overloaded {
				return true
			}
		}
		rule.context.Report(rule.context.Range(node), diagnostics.Expected_a_function_expression)
	} else if node.Kind == ast.KindFunctionExpression || node.Kind == ast.KindArrowFunction {
		if node.Kind == ast.KindArrowFunction && helpers.BooleanOptionValue(options, "allowArrowFunctions", false) {
			return true
		}
		expression := node
		for expression.Parent != nil && expression.Parent.Kind == ast.KindParenthesizedExpression {
			expression = expression.Parent
		}
		parent := expression.Parent
		if parent.Kind != ast.KindVariableDeclaration || parent.Initializer() != expression {
			return true
		}
		if ast.GetCombinedModifierFlags(parent)&ast.ModifierFlagsExport != 0 {
			if overrides, ok := options["overrides"].(map[string]any); ok {
				style = helpers.StringOptionValue(overrides["namedExports"], style)
			}
		}
		if style != "declaration" || helpers.BooleanOptionValue(options, "allowTypeAnnotation", false) && parent.AsVariableDeclaration().Type != nil {
			return true
		}
		if node.Kind == ast.KindArrowFunction && helpers.UsesLexicalThisOrSuper(node, node, true) {
			return true
		}
		rule.context.Report(rule.context.Range(parent), diagnostics.Expected_a_function_declaration)
	}
	return true
}

func (rule *funcStyleRule) OnExitNode(node *ast.Node) {
}

func newFuncStyle(context Context) Rule {
	return &funcStyleRule{context: context}
}
