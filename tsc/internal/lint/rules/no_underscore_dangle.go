package rules

import (
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type noUnderscoreDangleRule struct{ context Context }

func newNoUnderscoreDangleRule(context Context) Rule {
	rule := &noUnderscoreDangleRule{context: context}

	return Rule{
		Enter: rule.OnEnterNode,
		EnterKinds: []ast.Kind{
			ast.KindArrowFunction,
			ast.KindConstructor,
			ast.KindElementAccessExpression,
			ast.KindFunctionDeclaration,
			ast.KindFunctionExpression,
			ast.KindGetAccessor,
			ast.KindMethodDeclaration,
			ast.KindPropertyAccessExpression,
			ast.KindPropertyDeclaration,
			ast.KindSetAccessor,
			ast.KindVariableDeclaration,
		},
	}
}

func (rule *noUnderscoreDangleRule) OnEnterNode(node *ast.Node) bool {
	rule.underscore(node)
	return true
}

func noUnderscoreDangleName(node *ast.Node) (string, bool) {
	if node == nil {
		return "", false
	}
	if node.Kind == ast.KindComputedPropertyName {
		node = ast.SkipParentheses(node.Expression())
	}
	if node.Kind != ast.KindIdentifier && node.Kind != ast.KindPrivateIdentifier {
		return "", false
	}
	return strings.TrimPrefix(node.Text(), "#"), node.Kind == ast.KindPrivateIdentifier
}

func (rule *noUnderscoreDangleRule) underscore(node *ast.Node) {
	switch node.Kind {
	case ast.KindFunctionDeclaration, ast.KindFunctionExpression, ast.KindArrowFunction, ast.KindMethodDeclaration, ast.KindGetAccessor, ast.KindSetAccessor, ast.KindConstructor:
		if node.Kind == ast.KindFunctionDeclaration && node.Name() != nil {
			rule.underscoreReport(node, node.Name().Text(), false)
		}
		if !helpers.SharedRuleBoolean(rule.context.Options, "allowFunctionParams", true) && node.FunctionLikeData() != nil {
			for _, parameter := range node.FunctionLikeData().Parameters.Nodes {
				if parameter.Name().Kind == ast.KindIdentifier {
					rule.underscoreReport(parameter, parameter.Name().Text(), false)
				}
			}
		}
		if (ast.IsClassLike(node.Parent) || node.Kind == ast.KindMethodDeclaration) && helpers.SharedRuleBoolean(rule.context.Options, "enforceInMethodNames", false) {
			name, private := noUnderscoreDangleName(node.Name())
			rule.underscoreReport(node, name, private)
		}
	case ast.KindPropertyDeclaration:
		if helpers.SharedRuleBoolean(rule.context.Options, "enforceInClassFields", false) {
			name, private := noUnderscoreDangleName(node.Name())
			rule.underscoreReport(node, name, private)
		}
	case ast.KindVariableDeclaration:
		if node.Parent.Kind != ast.KindVariableDeclarationList {
			return
		}
		seen := make(map[string]bool)
		var binding func(*ast.Node, ast.Kind)
		binding = func(name *ast.Node, pattern ast.Kind) {
			if name.Kind == ast.KindIdentifier {
				if seen[name.Text()] {
					return
				}
				seen[name.Text()] = true
				if pattern == ast.KindArrayBindingPattern && helpers.SharedRuleBoolean(rule.context.Options, "allowInArrayDestructuring", true) || pattern == ast.KindObjectBindingPattern && helpers.SharedRuleBoolean(rule.context.Options, "allowInObjectDestructuring", true) {
					return
				}
				if rule.context.GetChecker().GetSymbolAtLocation(name) != nil {
					rule.underscoreReport(node, name.Text(), false)
				}
			} else if ast.IsBindingPattern(name) {
				for _, element := range name.AsBindingPattern().Elements.Nodes {
					if element.Kind == ast.KindBindingElement {
						binding(element.Name(), name.Kind)
					}
				}
			}
		}
		binding(node.Name(), ast.KindUnknown)
	case ast.KindPropertyAccessExpression, ast.KindElementAccessExpression:
		property := node.Name()
		if node.Kind == ast.KindElementAccessExpression {
			property = ast.SkipParentheses(node.AsElementAccessExpression().ArgumentExpression)
		}
		name, _ := noUnderscoreDangleName(property)
		if name == "__proto__" {
			return
		}
		object := ast.SkipParentheses(node.Expression())
		if object.Kind == ast.KindThisKeyword && helpers.SharedRuleBoolean(rule.context.Options, "allowAfterThis", false) || object.Kind == ast.KindSuperKeyword && helpers.SharedRuleBoolean(rule.context.Options, "allowAfterSuper", false) {
			return
		}
		if ast.IsAccessExpression(object) && !helpers.SharedOptionalChainBoundary(node.Expression()) && helpers.SharedRuleBoolean(rule.context.Options, "allowAfterThisConstructor", false) {
			property := object.Name()
			if object.Kind == ast.KindElementAccessExpression {
				property = ast.SkipParentheses(object.AsElementAccessExpression().ArgumentExpression)
			}
			if property != nil && property.Kind == ast.KindIdentifier && property.Text() == "constructor" && ast.SkipParentheses(object.Expression()).Kind == ast.KindThisKeyword {
				return
			}
		}
		rule.underscoreReport(node, name, false)
	}
}

func (rule *noUnderscoreDangleRule) underscoreReport(node *ast.Node, name string, private bool) {
	if name == "" || rule.underscoreAllowed(name) {
		return
	}
	if private {
		name = "#" + name
	}
	rule.context.Report(rule.context.Range(node), diagnostics.Unexpected_dangling_in_0, name)
}

func (rule *noUnderscoreDangleRule) underscoreAllowed(name string) bool {
	if name == "_" || !strings.HasPrefix(name, "_") && !strings.HasSuffix(name, "_") {
		return true
	}
	if len(rule.context.Options) > 0 {
		options, _ := rule.context.Options[0].(map[string]any)
		return helpers.StringListOptionContains(options["allow"], name)
	}
	return false
}
