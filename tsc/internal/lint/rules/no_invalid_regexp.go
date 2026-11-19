package rules

import (
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type noInvalidRegexp struct{ helpers.RegexSource }

func newNoInvalidRegexp(context Context) Rule {
	rule := &noInvalidRegexp{RegexSource: helpers.NewRegexSource(context)}

	return Rule{
		Enter:          rule.OnEnterNode,
		EnterKinds:     []ast.Kind{ast.KindRegularExpressionLiteral, ast.KindCallExpression, ast.KindNewExpression},
		GetSuggestions: rule.Suggestions,
	}
}

func (rule *noInvalidRegexp) OnEnterNode(node *ast.Node) bool {
	input := rule.DirectInput(node)
	if input != nil && !input.Literal {
		rule.invalid(input)
	}
	return true
}

func (rule *noInvalidRegexp) invalid(input *helpers.RegexInput) {
	flags := ""
	if input.KnownFlags {
		flags = input.Flags
	}
	var allowedFlags strings.Builder
	allowedFlags.WriteString("dgimsuvy")
	if options, ok := rule.Options()["allowConstructorFlags"].([]any); ok {
		for _, flag := range options {
			if text, ok := flag.(string); ok {
				allowedFlags.WriteString(text)
			}
		}
	}
	allowed := allowedFlags.String()
	remaining := flags
	for _, flag := range allowed {
		remaining = strings.Replace(remaining, string(flag), "", 1)
	}
	message := ""
	switch {
	case strings.Contains(flags, "u") && strings.Contains(flags, "v"):
		message = "Regex 'u' and 'v' flags cannot be used together"
	case remaining != "":
		var duplicate strings.Builder
		for _, flag := range remaining {
			if strings.ContainsRune(allowed, flag) {
				duplicate.WriteRune(flag)
			}
		}
		if duplicate.Len() != 0 {
			message = "Duplicate flags ('" + duplicate.String() + "') supplied to RegExp constructor"
		} else {
			message = "Invalid flags supplied to RegExp constructor '" + remaining + "'"
		}
	}
	if message == "" && input.KnownPattern {
		mode := ""
		if strings.Contains(flags, "u") {
			mode = "u"
		}
		if strings.Contains(flags, "v") {
			mode = "v"
		}
		parsed := scanner.ParseRegExpLint(input.Pattern, mode)
		if !parsed.Valid && (!input.KnownFlags && !scanner.ParseRegExpLint(input.Pattern, "u").Valid && !scanner.ParseRegExpLint(input.Pattern, "v").Valid || input.KnownFlags) {
			message = "Invalid regular expression: /" + input.Pattern + "/" + mode + ": " + parsed.Error
		}
	}
	if message != "" {
		rule.Context.Report(rule.Context.Range(input.Node), diagnostics.X_0, message)
	}
}
