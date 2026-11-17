package helpers

import (
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

func (rule *RegexSource) Edit(diagnostic *ast.Diagnostic, ruleName string, start, end int, text string, description *ast.Diagnostic, suggestion bool) {
	if rule.Context.NewTracker == nil {
		return
	}
	tracker := rule.Context.NewTracker()
	tracker.ReplaceTextRangeWithText(rule.Context.File, core.NewTextRange(start, end), text)
	action := codefix.CreateCodeFixAction(ruleName, tracker.GetTextChanges(), description, ruleName, ast.NewCompilerDiagnostic(diagnostics.Fix_all_0, ruleName))
	if suggestion {
		rule.suggestions[diagnostic] = append(rule.suggestions[diagnostic], action)
	} else {
		diagnostic.SetCodeFixes(action)
	}
}

func (rule *RegexSource) FlagSuggestion(diagnostic *ast.Diagnostic, ruleName string, input *RegexInput, flag string, description *ast.Diagnostic) {
	if !input.KnownPattern || !scanner.ParseRegExpLint(input.Pattern, flag).Valid {
		return
	}
	flags := strings.ReplaceAll(strings.ReplaceAll(input.Flags, "u", ""), "v", "") + flag
	if input.Literal {
		slash := strings.LastIndexByte(rule.Text(input.Node), '/')
		rule.Edit(diagnostic, ruleName, rule.Start(input.Node)+slash+1, input.Node.End(), flags, description, true)
		return
	}
	if input.FlagsNode != nil {
		if input.FlagsNode.Kind != ast.KindStringLiteral && input.FlagsNode.Kind != ast.KindNoSubstitutionTemplateLiteral {
			return
		}
		raw := rule.Text(input.FlagsNode)
		if strings.Contains(raw, `\`) && strings.ContainsAny(input.Flags, "uv") {
			return
		}
		raw = raw[:1] + strings.ReplaceAll(strings.ReplaceAll(raw[1:len(raw)-1], "u", ""), "v", "") + flag + raw[len(raw)-1:]
		rule.Edit(diagnostic, ruleName, rule.Start(input.FlagsNode), input.FlagsNode.End(), raw, description, true)
		return
	}
	if len(input.Arguments) == 0 {
		return
	}
	last := input.Arguments[len(input.Arguments)-1]
	trailing := rule.Context.File.Text()[last.End():input.Node.End()]
	if strings.Contains(trailing, ",") {
		comma := last.End() + strings.IndexByte(trailing, ',') + 1
		rule.Edit(diagnostic, ruleName, comma, comma, " \""+flag+"\",", description, true)
	} else {
		rule.Edit(diagnostic, ruleName, last.End(), last.End(), ", \""+flag+"\"", description, true)
	}
}
