package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type noOctal struct {
	helpers.DiagnosticSuggestions
	context Context
}

func (rule *noOctal) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindNumericLiteral {
		raw := rule.context.File.Text()[helpers.RuleTokenStart(rule.context, node):node.End()]
		if len(raw) > 1 && raw[0] == '0' && raw[1] >= '0' && raw[1] <= '9' {
			rule.context.Report(rule.context.Range(node), diagnostics.Octal_literals_should_not_be_used)
		}
	}
	return true
}

func (rule *noOctal) OnExitNode(node *ast.Node) {}

func newNoOctal(context Context) Rule { return &noOctal{context: context} }
