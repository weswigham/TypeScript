package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
)

type noConstructorReturnRule struct{ context Context }

func newNoConstructorReturnRule(context Context) Rule {
	rule := &noConstructorReturnRule{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindReturnStatement},
	}
}

func (rule *noConstructorReturnRule) OnEnterNode(node *ast.Node) bool {
	if node.Kind != ast.KindReturnStatement || node.Expression() == nil {
		return true
	}
	for parent := node.Parent; parent != nil; parent = parent.Parent {
		if ast.IsFunctionLike(parent) {
			if parent.Kind == ast.KindConstructor {
				rule.context.Report(rule.context.Range(node), diagnostics.Unexpected_return_statement_in_constructor)
			}
			break
		}
	}
	return true
}
