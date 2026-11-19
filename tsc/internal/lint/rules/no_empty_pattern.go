package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type noEmptyPattern struct {
	context Context
}

func newNoEmptyPattern(context Context) Rule {
	rule := &noEmptyPattern{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindArrayBindingPattern, ast.KindArrayLiteralExpression, ast.KindObjectBindingPattern, ast.KindObjectLiteralExpression},
	}
}

func (rule *noEmptyPattern) OnEnterNode(node *ast.Node) bool {
	switch node.Kind {
	case ast.KindObjectBindingPattern:
		if len(node.AsBindingPattern().Elements.Nodes) == 0 {
			if helpers.SharedRuleBoolean(rule.context.Options, "allowObjectPatternsAsParameters", false) && node.Parent.Kind == ast.KindParameter && node.Parent.AsParameterDeclaration().DotDotDotToken == nil && ast.IsFunctionLike(node.Parent.Parent) {
				initializer := node.Parent.Initializer()
				if initializer != nil {
					initializer = ast.SkipParentheses(initializer)
				}
				if initializer == nil || initializer.Kind == ast.KindObjectLiteralExpression && len(initializer.AsObjectLiteralExpression().Properties.Nodes) == 0 {
					return true
				}
			}
			rule.context.Report(rule.context.Range(node), noEmptyPatternMessage, "object")
		}
	case ast.KindArrayBindingPattern:
		if len(node.AsBindingPattern().Elements.Nodes) == 0 {
			rule.context.Report(rule.context.Range(node), noEmptyPatternMessage, "array")
		}
	case ast.KindObjectLiteralExpression:
		if len(node.AsObjectLiteralExpression().Properties.Nodes) == 0 && ast.IsAssignmentTarget(node) {
			rule.context.Report(rule.context.Range(node), noEmptyPatternMessage, "object")
		}
	case ast.KindArrayLiteralExpression:
		if len(node.AsArrayLiteralExpression().Elements.Nodes) == 0 && ast.IsAssignmentTarget(node) {
			rule.context.Report(rule.context.Range(node), noEmptyPatternMessage, "array")
		}
	}
	return true
}

var noEmptyPatternMessage = diagnostics.Unexpected_empty_0_pattern
