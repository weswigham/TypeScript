package rules

import (
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type requireUnicodeRegexp struct{ helpers.RegexSource }

func (rule *requireUnicodeRegexp) OnEnterNode(node *ast.Node) bool {
	input := rule.Input(node)
	if input != nil {
		rule.unicodeFlag(input)
	}
	return true
}

func (rule *requireUnicodeRegexp) unicodeFlag(input *helpers.RegexInput) {
	if !input.Literal && len(input.Arguments) > 0 && input.Arguments[0].Kind == ast.KindSpreadElement {
		return
	}
	if !input.KnownFlags {
		return
	}
	required, _ := rule.Options()["requireFlag"].(string)
	if required == "" {
		if strings.ContainsAny(input.Flags, "uv") {
			return
		}
		required = "u"
	} else if strings.Contains(input.Flags, required) {
		return
	}
	message, description := diagnostics.Use_the_u_flag, ast.NewCompilerDiagnostic(diagnostics.Add_the_u_flag)
	if required == "v" {
		message, description = diagnostics.Use_the_v_flag, ast.NewCompilerDiagnostic(diagnostics.Add_the_v_flag)
	}
	diagnostic := rule.Context.Report(rule.Context.Range(input.Node), message)
	rule.FlagSuggestion(diagnostic, "require-unicode-regexp", input, required, description)
}

func newRequireUnicodeRegexp(context Context) Rule {
	return &requireUnicodeRegexp{RegexSource: helpers.NewRegexSource(context)}
}
