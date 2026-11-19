package rules

import (
	"fmt"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type noNonoctalDecimalEscape struct {
	helpers.DiagnosticSuggestions
	context Context
}

func newNoNonoctalDecimalEscape(context Context) Rule {
	rule := &noNonoctalDecimalEscape{context: context}

	return Rule{
		Enter:          rule.OnEnterNode,
		EnterKinds:     []ast.Kind{ast.KindStringLiteral},
		GetSuggestions: rule.Suggestions,
	}
}

func (rule *noNonoctalDecimalEscape) OnEnterNode(node *ast.Node) bool {
	if node.Kind != ast.KindStringLiteral {
		return true
	}
	start := helpers.RuleTokenStart(rule.context, node)
	raw := rule.context.File.Text()[start:node.End()]
	previousNullEnd := -1
	for index := 1; index+1 < len(raw); index++ {
		if raw[index] != '\\' {
			continue
		}
		digit := raw[index+1]
		if digit == '8' || digit == '9' {
			from, to := start+index, start+index+2
			original := raw[index : index+2]
			diagnostic := rule.context.Report(core.NewTextRange(from, to), diagnostics.Don_t_use_0_escape_sequence, original)
			if rule.context.NewTracker != nil {
				add := func(first int, replacement string, backslash bool) {
					tracker := rule.context.NewTracker()
					tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(first, to), replacement)
					description := ast.NewCompilerDiagnostic(diagnostics.Replace_0_with_1_This_maintains_the_current_functionality, rule.context.File.Text()[first:to], replacement)
					if backslash {
						description = ast.NewCompilerDiagnostic(diagnostics.Replace_0_with_1_to_include_the_actual_backslash_character, original, replacement)
					}
					rule.AddSuggestion(diagnostic, "no-nonoctal-decimal-escape", tracker.GetTextChanges(), description)
				}
				if previousNullEnd == index {
					add(from-2, "\\u0000"+string(digit), false)
					add(from, fmt.Sprintf("\\u%04x", digit), false)
				} else {
					add(from, string(digit), false)
				}
				add(from, "\\"+original, true)
			}
		}
		if digit == '0' {
			previousNullEnd = index + 2
		}
		index++
	}
	return true
}
