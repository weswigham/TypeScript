package rules

import (
	"slices"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type typescriptExplicitFunctionReturnTypeRule struct {
	context Context
}

func (rule *typescriptExplicitFunctionReturnTypeRule) OnEnterNode(node *ast.Node) bool {
	rule.returnType(node)
	return true
}

func (rule *typescriptExplicitFunctionReturnTypeRule) OnExitNode(node *ast.Node) {}

func (rule *typescriptExplicitFunctionReturnTypeRule) returnType(node *ast.Node) {
	if !helpers.FunctionHasBody(node) || node.Type() != nil || node.Kind == ast.KindConstructor || node.Kind == ast.KindSetAccessor {
		return
	}
	if rule.Boolean("allowFunctionsWithoutTypeParameters", false) && node.TypeParameterList() == nil {
		return
	}
	_, parent := helpers.OuterParenthesizedNodeAndParent(node)
	if rule.Boolean("allowIIFEs", false) && parent != nil && parent.Kind == ast.KindCallExpression {
		return
	}
	name := node.Name()
	if name == nil && parent != nil && (parent.Kind == ast.KindVariableDeclaration || parent.Kind == ast.KindPropertyDeclaration || parent.Kind == ast.KindPropertyAssignment) {
		name = parent.Name()
	}
	if name != nil && name.Kind == ast.KindIdentifier && slices.Contains(helpers.TypescriptSyntaxStrings(rule.Options()["allowedNames"]), name.Text()) {
		return
	}
	body := ast.SkipParentheses(node.Body())
	if node.Kind == ast.KindArrowFunction && body.Kind == ast.KindVoidExpression && rule.Boolean("allowConciseArrowFunctionExpressionsStartingWithVoid", false) {
		return
	}
	expression := node.Kind != ast.KindFunctionDeclaration
	if expression && rule.Boolean("allowTypedFunctionExpressions", true) {
		if rule.typedFunction(node) {
			return
		}
		if rule.Boolean("allowExpressions", false) && parent != nil && parent.Kind != ast.KindVariableDeclaration && parent.Kind != ast.KindPropertyDeclaration && node.Kind != ast.KindMethodDeclaration && node.Kind != ast.KindGetAccessor && parent.Kind != ast.KindExportAssignment {
			return
		}
		if node.Kind == ast.KindArrowFunction && rule.Boolean("allowDirectConstAssertionInArrowFunctions", true) {
			assertion := body
			for assertion.Kind == ast.KindSatisfiesExpression {
				assertion = ast.SkipParentheses(assertion.Expression())
			}
			if (assertion.Kind == ast.KindAsExpression || assertion.Kind == ast.KindTypeAssertionExpression) && helpers.TsAConstAssertion(assertion.Type()) {
				return
			}
		}
	}
	if rule.Boolean("allowHigherOrderFunctions", true) {
		if body.Kind == ast.KindArrowFunction || body.Kind == ast.KindFunctionExpression {
			return
		}
		returns, allFunctions := 0, true
		var visit func(*ast.Node)
		visit = func(child *ast.Node) {
			if ast.IsFunctionLike(child) {
				return
			}
			if child.Kind == ast.KindReturnStatement {
				returns++
				value := child.AsReturnStatement().Expression
				if value == nil || ast.SkipParentheses(value).Kind != ast.KindFunctionExpression && ast.SkipParentheses(value).Kind != ast.KindArrowFunction {
					allFunctions = false
				}
			}
			child.ForEachChild(func(nested *ast.Node) bool { visit(nested); return false })
		}
		visit(body)
		if returns > 0 && allFunctions {
			return
		}
	}
	rule.context.Report(helpers.FunctionHeadRange(rule.context, node), diagnostics.Missing_return_type_on_function)
}

func (rule *typescriptExplicitFunctionReturnTypeRule) Boolean(name string, fallback bool) bool {
	return helpers.BooleanOptionValue(rule.Options(), name, fallback)
}

func (rule *typescriptExplicitFunctionReturnTypeRule) Options() map[string]any {
	options, _ := rule.option(0).(map[string]any)
	return options
}

func (rule *typescriptExplicitFunctionReturnTypeRule) typedFunction(node *ast.Node) bool {
	outer, parent := helpers.OuterParenthesizedNodeAndParent(node)
	if helpers.TypescriptTypedFunctionParent(parent, outer) || parent != nil && parent.Kind == ast.KindNewExpression {
		return true
	}
	property := node
	if property.Kind != ast.KindMethodDeclaration && property.Parent != nil && property.Parent.Kind == ast.KindPropertyAssignment {
		property = property.Parent
	}
	for property != nil && (property.Kind == ast.KindPropertyAssignment || property.Kind == ast.KindMethodDeclaration || property.Kind == ast.KindGetAccessor || property.Kind == ast.KindSetAccessor) && property.Parent.Kind == ast.KindObjectLiteralExpression {
		_, propertyParent := helpers.OuterParenthesizedNodeAndParent(property.Parent)
		if helpers.TypescriptTypedFunctionParent(propertyParent, nil) {
			return true
		}
		property = propertyParent
	}
	if parent == nil || parent.Kind != ast.KindReturnStatement && !(parent.Kind == ast.KindArrowFunction && parent.Body().Kind != ast.KindBlock) {
		return false
	}
	for ancestor := parent; ancestor != nil; ancestor = ancestor.Parent {
		if helpers.TypescriptExecutableFunction(ancestor) && ancestor.Type() != nil {
			return true
		}
		if ancestor.Kind == ast.KindVariableDeclaration || ancestor.Kind == ast.KindPropertyDeclaration {
			return ancestor.Type() != nil
		}
		if ancestor.Kind == ast.KindExpressionStatement {
			return false
		}
	}
	return false
}

func (rule *typescriptExplicitFunctionReturnTypeRule) option(index int) any {
	if index < len(rule.context.Options) {
		return rule.context.Options[index]
	}
	return nil
}

func newTypeScriptExplicitFunctionReturnType(context Context) Rule {
	return &typescriptExplicitFunctionReturnTypeRule{context: context}
}
