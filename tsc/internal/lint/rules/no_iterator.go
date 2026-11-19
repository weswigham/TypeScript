package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type noIterator struct {
	context Context
}

func newNoIterator(context Context) Rule {
	rule := &noIterator{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindPropertyAccessExpression, ast.KindElementAccessExpression},
	}
}

func (rule *noIterator) OnEnterNode(node *ast.Node) bool {
	if helpers.StatementPropertyName(node) == "__iterator__" {
		rule.context.Report(rule.context.Range(node), diagnostics.Reserved_name_iterator)
	}

	return true
}
