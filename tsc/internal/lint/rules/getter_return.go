package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type getterReturn struct{ helpers.ReturnRuleContext }

func newGetterReturn(context Context) Rule {
	rule := &getterReturn{Context: context}

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
		},
		GetSuggestions: rule.Suggestions,
	}
}

func (rule *getterReturn) OnExitNode(node *ast.Node) {
	if !helpers.ReturnFunction(node) {
		return
	}
	returns, normal, _ := helpers.AnalyzeFunctionReturns(node)
	rule.getter(node, returns, normal)
}

func (rule *getterReturn) descriptor(node *ast.Node) bool {
	outer := helpers.ReturnOuter(node)
	property := outer.Parent
	if node.Kind == ast.KindMethodDeclaration {
		property = node
	}
	if property == nil || property.Kind != ast.KindPropertyAssignment && property.Kind != ast.KindMethodDeclaration {
		return false
	}
	name, ok := helpers.ReturnProperty(property.Name())
	if !ok || name != "get" || property.Parent == nil || property.Parent.Kind != ast.KindObjectLiteralExpression {
		return false
	}
	object := helpers.ReturnOuter(property.Parent)
	parent := object.Parent
	if parent == nil {
		return false
	}
	if parent.Kind == ast.KindPropertyAssignment && parent.Parent.Kind == ast.KindObjectLiteralExpression {
		object = helpers.ReturnOuter(parent.Parent)
		parent = object.Parent
		if parent == nil || parent.Kind != ast.KindCallExpression {
			return false
		}
		call := parent.AsCallExpression()
		receiver, method := helpers.ReturnMember(call.Expression)
		return rule.descriptorGlobal(receiver, "Object") && (method == "create" || method == "defineProperties") && call.Arguments != nil && len(call.Arguments.Nodes) >= 2 && call.Arguments.Nodes[1] == object
	}
	if parent.Kind != ast.KindCallExpression {
		return false
	}
	call := parent.AsCallExpression()
	receiver, method := helpers.ReturnMember(call.Expression)
	return (rule.descriptorGlobal(receiver, "Object") || rule.descriptorGlobal(receiver, "Reflect")) && method == "defineProperty" && call.Arguments != nil && len(call.Arguments.Nodes) >= 3 && call.Arguments.Nodes[2] == object
}

func (rule *getterReturn) descriptorGlobal(node *ast.Node, name string) bool {
	if node == nil {
		return false
	}
	node = ast.SkipParentheses(node)
	if node.Kind != ast.KindIdentifier || node.Text() != name {
		return false
	}
	if rule.Context.GetChecker != nil {
		if symbol := rule.Context.GetChecker().GetSymbolAtLocation(node); symbol != nil {
			for _, declaration := range symbol.Declarations() {
				if ast.GetSourceFileOfNode(declaration) == rule.Context.File {
					return false
				}
			}
		}
	}
	return true
}

func (rule *getterReturn) getter(node *ast.Node, returns []*ast.Node, normal bool) {
	if node.Body().Kind != ast.KindBlock || node.Kind != ast.KindGetAccessor && !rule.descriptor(node) {
		return
	}
	name := helpers.ReturnName(node)
	if !rule.Option("allowImplicit", false) {
		for _, statement := range returns {
			if statement.Expression() == nil {
				rule.Context.Report(rule.Context.Range(statement), diagnostics.Expected_to_return_a_value_in_0, name)
			}
		}
	}
	if normal {
		message := diagnostics.Expected_to_return_a_value_in_0
		if len(returns) != 0 {
			message = diagnostics.Expected_0_to_always_return_a_value
		}
		rule.Context.Report(rule.Head(node, false), message, name)
	}
}
