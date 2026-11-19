package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type noOctalEscape struct {
	helpers.DiagnosticSuggestions
	context Context
}

func newNoOctalEscape(context Context) Rule {
	rule := &noOctalEscape{context: context}

	return Rule{
		Enter:          rule.OnEnterNode,
		EnterKinds:     []ast.Kind{ast.KindStringLiteral},
		GetSuggestions: rule.Suggestions,
	}
}

func (rule *noOctalEscape) OnEnterNode(node *ast.Node) bool {
	if node.Kind != ast.KindStringLiteral {
		return true
	}
	start := helpers.RuleTokenStart(rule.context, node)
	raw := rule.context.File.Text()[start:node.End()]
	for index := 1; index+1 < len(raw); index++ {
		if raw[index] != '\\' {
			continue
		}
		digit := raw[index+1]
		if digit >= '0' && digit <= '7' {
			end := index + 2
			limit := index + 3
			if digit <= '3' {
				limit++
			}
			for end < len(raw) && end < limit && raw[end] >= '0' && raw[end] <= '7' {
				end++
			}
			if digit != '0' || end > index+2 || end < len(raw) && (raw[end] == '8' || raw[end] == '9') {
				rule.context.Report(rule.context.Range(node), diagnostics.Don_t_use_octal_Colon_0_Use_u_instead, raw[index+1:end])
				break
			}
		}
		index++
	}
	return true
}
