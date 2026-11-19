package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type noProto struct {
	context Context
}

func newNoProto(context Context) Rule {
	rule := &noProto{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindPropertyAccessExpression, ast.KindElementAccessExpression},
	}
}

func (rule *noProto) OnEnterNode(node *ast.Node) bool {
	if helpers.StatementPropertyName(node) == "__proto__" {
		rule.context.Report(rule.context.Range(node), diagnostics.The_proto_property_is_deprecated)
	}
	return true
}
