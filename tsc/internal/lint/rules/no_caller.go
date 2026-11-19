package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
)

type noCaller struct {
	context Context
}

func newNoCaller(context Context) Rule {
	rule := &noCaller{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindPropertyAccessExpression},
	}
}

func (rule *noCaller) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindPropertyAccessExpression {
		object := ast.SkipParentheses(node.Expression())
		name := node.Name()
		if object.Kind == ast.KindIdentifier && object.Text() == "arguments" && name.Kind == ast.KindIdentifier && (name.Text() == "callee" || name.Text() == "caller") {
			rule.context.Report(rule.context.Range(node), diagnostics.Avoid_arguments_0, name.Text())
		}
	}
	return true
}
