package rules

import (
	"fmt"
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type noControlRegex struct{ helpers.RegexSource }

func newNoControlRegex(context Context) Rule {
	rule := &noControlRegex{RegexSource: helpers.NewRegexSource(context)}

	return Rule{
		Enter:          rule.OnEnterNode,
		EnterKinds:     []ast.Kind{ast.KindRegularExpressionLiteral, ast.KindCallExpression, ast.KindNewExpression},
		GetSuggestions: rule.Suggestions,
	}
}

func (rule *noControlRegex) OnEnterNode(node *ast.Node) bool {
	input := rule.DirectInput(node)
	if input == nil || !input.KnownPattern {
		return true
	}
	rule.controls(input, helpers.ParseRegexInput(input))
	return true
}

func (rule *noControlRegex) controls(input *helpers.RegexInput, parsed *scanner.RegExpLint) {
	var controls []string
	parsed.Walk(func(node *scanner.RegExpLintNode, entering bool) {
		if !entering || node.Kind != scanner.RegExpLintCharacter || node.Value > 31 || node.Value < 0 {
			return
		}
		raw := input.Pattern[node.Start:node.End]
		if len(raw) > 0 && rune(raw[0]) == node.Value || strings.HasPrefix(raw, `\x`) || strings.HasPrefix(raw, `\u`) {
			if parsed.Valid || node.End <= parsed.ErrorPos {
				controls = append(controls, fmt.Sprintf(`\x%02x`, node.Value))
			}
		}
	})
	if len(controls) > 0 {
		node := input.Node
		if !input.Literal {
			node = input.PatternNode
		}
		rule.Context.Report(rule.Context.Range(node), diagnostics.Unexpected_control_character_s_in_regular_expression_Colon_0, strings.Join(controls, ", "))
	}
}
