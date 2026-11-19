package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type noSetterReturn struct {
	context Context
}

func newNoSetterReturn(context Context) Rule {
	rule := &noSetterReturn{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindArrowFunction, ast.KindReturnStatement},
	}
}

func (rule *noSetterReturn) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindReturnStatement && node.Expression() != nil {
		for parent := node.Parent; parent != nil; parent = parent.Parent {
			if ast.IsFunctionLike(parent) {
				if rule.isSetter(parent) {
					rule.context.Report(rule.context.Range(node), diagnostics.Setter_cannot_return_a_value)
				}
				break
			}
		}
	} else if node.Kind == ast.KindArrowFunction && node.Body().Kind != ast.KindBlock && rule.isSetter(node) {
		rule.context.Report(rule.context.Range(ast.SkipParentheses(node.Body())), diagnostics.Setter_cannot_return_a_value)
	}
	return true
}

func (rule *noSetterReturn) isSetter(node *ast.Node) bool {
	if node.Kind == ast.KindSetAccessor {
		return true
	}
	property := helpers.OuterParenthesizedExpression(node).Parent
	if node.Kind == ast.KindMethodDeclaration {
		property = node
	}
	if property == nil || property.Kind != ast.KindPropertyAssignment && property.Kind != ast.KindMethodDeclaration {
		return false
	}
	name, ok := helpers.StaticMemberNameText(property)
	if !ok || name != "set" || property.Parent.Kind != ast.KindObjectLiteralExpression {
		return false
	}
	descriptor := helpers.OuterParenthesizedExpression(property.Parent)
	if rule.globalMethodArgument(descriptor, "Object", "defineProperty", 2) || rule.globalMethodArgument(descriptor, "Reflect", "defineProperty", 2) {
		return true
	}
	parent := descriptor.Parent
	if parent != nil && parent.Kind == ast.KindPropertyAssignment && parent.Parent.Kind == ast.KindObjectLiteralExpression {
		descriptors := helpers.OuterParenthesizedExpression(parent.Parent)
		return rule.globalMethodArgument(descriptors, "Object", "create", 1) || rule.globalMethodArgument(descriptors, "Object", "defineProperties", 1)
	}
	return false
}

func (rule *noSetterReturn) globalMethodArgument(node *ast.Node, object, method string, index int) bool {
	call := node.Parent
	if call == nil || call.Kind != ast.KindCallExpression {
		return false
	}
	arguments := call.AsCallExpression().Arguments.Nodes
	if len(arguments) <= index || arguments[index] != node {
		return false
	}
	callee := ast.SkipParentheses(call.Expression())
	if !ast.IsAccessExpression(callee) {
		return false
	}
	name, ok := helpers.StaticMemberNameText(callee)
	identifier := ast.SkipParentheses(callee.Expression())
	return ok && name == method && identifier.Kind == ast.KindIdentifier && identifier.Text() == object && helpers.StatementBuiltin(rule.context, identifier, true)
}
