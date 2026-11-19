package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
)

type noTernary struct {
	context Context
}

func newNoTernary(context Context) Rule {
	rule := &noTernary{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindConditionalExpression},
	}
}

func (rule *noTernary) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindConditionalExpression {
		rule.context.Report(rule.context.Range(node), diagnostics.Ternary_operator_used)
	}
	return true
}
