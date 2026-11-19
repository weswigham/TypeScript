package rules

import (
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type noMultiStr struct {
	context Context
}

func newNoMultiStr(context Context) Rule {
	rule := &noMultiStr{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindStringLiteral},
	}
}

func (rule *noMultiStr) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindStringLiteral && node.Parent.Kind != ast.KindJsxAttribute && strings.ContainsAny(helpers.SourceNodeText(rule.context, node), "\r\n\u2028\u2029") {
		rule.context.Report(rule.context.Range(node), diagnostics.Multiline_support_is_limited_to_browsers_supporting_ES5_only)
	}

	return true
}
