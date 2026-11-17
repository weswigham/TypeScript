package rules

import (
	"regexp"
	"strings"
	"unicode/utf8"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/astnav"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/ls/change"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type typescriptBanTsCommentRule struct {
	context Context
	helpers.DiagnosticSuggestions
}

func (rule *typescriptBanTsCommentRule) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindSourceFile {
		rule.comments()
	}
	return false
}

func (rule *typescriptBanTsCommentRule) OnExitNode(node *ast.Node) {}

func (rule *typescriptBanTsCommentRule) comments() {
	file := rule.context.File
	text := file.Text()
	lexer := scanner.NewScanner()
	lexer.SetText(text)
	lexer.SetSkipTrivia(false)
	previous := 0
	for {
		lexer.ResetPos(previous)
		for token := lexer.Scan(); token == ast.KindSingleLineCommentTrivia || token == ast.KindMultiLineCommentTrivia || token == ast.KindWhitespaceTrivia || token == ast.KindNewLineTrivia; token = lexer.Scan() {
			if token == ast.KindSingleLineCommentTrivia || token == ast.KindMultiLineCommentTrivia {
				rule.comment(lexer.TokenStart(), lexer.TokenEnd(), token)
			}
		}
		if lexer.Token() == ast.KindEndOfFile {
			break
		}
		token := astnav.GetTokenAtPosition(file, lexer.TokenStart())
		if token == nil || token.End() <= previous {
			break
		}
		previous = token.End()
	}
}

func (rule *typescriptBanTsCommentRule) comment(start, end int, kind ast.Kind) {
	text := rule.context.File.Text()
	value := text[start+2 : end]
	var match []string
	if kind == ast.KindSingleLineCommentTrivia {
		match = typescriptBanTSCommentPragma.FindStringSubmatch(text[start:end])
		if match == nil {
			match = typescriptBanTSCommentDirective.FindStringSubmatch(value)
		}
	} else {
		value = strings.TrimSuffix(value, "*/")
		lines := strings.FieldsFunc(value, func(character rune) bool {
			return character == '\n' || character == '\r' || character == '\u2028' || character == '\u2029'
		})
		if len(lines) > 0 {
			last := strings.TrimLeftFunc(lines[len(lines)-1], helpers.TsCommentSpace)
			last = strings.TrimLeft(last, "/*")
			match = typescriptBanTSCommentDirective.FindStringSubmatch(last)
		}
	}
	if match == nil {
		return
	}
	directive, description := match[1], match[2]
	if directive == "nocheck" {
		statements := rule.context.File.Statements
		if len(statements.Nodes) > 0 {
			first := scanner.GetTokenPosOfNode(statements.Nodes[0], rule.context.File, false)
			if strings.Count(text[:first], "\n") <= strings.Count(text[:start], "\n") {
				return
			}
		}
	}
	defaults := map[string]any{"ts-check": false, "ts-nocheck": true, "ts-ignore": true, "ts-expect-error": "allow-with-description"}
	option, exists := rule.Options()["ts-"+directive]
	if !exists {
		option = defaults["ts-"+directive]
	}
	location := core.NewTextRange(start, end)
	if option == true {
		if directive == "ignore" {
			diagnostic := rule.context.Report(location, diagnostics.Use_ts_expect_error_instead_of_ts_ignore_as_ts_ignore_will_do_nothing_if_the_following_line_is_error_free)
			if rule.context.NewTracker != nil {
				tracker := rule.context.NewTracker()
				position := start + strings.Index(text[start:end], "@ts-ignore")
				tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(position, position+len("@ts-ignore")), "@ts-expect-error")
				rule.suggest(diagnostic, tracker, ast.NewCompilerDiagnostic(diagnostics.Replace_ts_ignore_with_ts_expect_error))
			}
		} else {
			rule.context.Report(location, diagnostics.Do_not_use_ts_0_because_it_alters_compilation_errors, directive)
		}
	} else {
		format := ""
		if object, ok := option.(map[string]any); ok {
			format, _ = object["descriptionFormat"].(string)
		}
		if option == "allow-with-description" || format != "" {
			minimum := helpers.IntegerOptionValue(rule.Options()["minimumDescriptionLength"], 3)
			if utf8.RuneCountInString(strings.TrimFunc(description, helpers.TsCommentSpace)) < minimum {
				rule.context.Report(location, diagnostics.Include_a_description_after_the_ts_0_directive_to_explain_why_the_ts_0_is_necessary_The_description_must_be_1_characters_or_longer, directive, minimum)
			} else if format != "" && !helpers.MatchesRegularExpression(format, description) {
				rule.context.Report(location, diagnostics.The_description_for_the_ts_0_directive_must_match_the_1_format, directive, format)
			}
		}
	}
}

func (rule *typescriptBanTsCommentRule) Options() map[string]any {
	options, _ := rule.option(0).(map[string]any)
	return options
}

func (rule *typescriptBanTsCommentRule) suggest(diagnostic *ast.Diagnostic, tracker *change.Tracker, description *ast.Diagnostic) {
	rule.AddSuggestion(diagnostic, "@typescript-eslint/ban-ts-comment", tracker.GetTextChanges(), description)
}

func (rule *typescriptBanTsCommentRule) option(index int) any {
	if index < len(rule.context.Options) {
		return rule.context.Options[index]
	}
	return nil
}

var (
	typescriptBanTSCommentDirective = regexp.MustCompile(`^/*[\t\v\f \r\n\x{00a0}\x{feff}]*@ts-(expect-error|ignore)(.*)`)
	typescriptBanTSCommentPragma    = regexp.MustCompile(`^///?[\t\v\f \r\n\x{00a0}\x{feff}]*@ts-(check|nocheck)(.*)$`)
)

func newTypeScriptBanTsComment(context Context) Rule {
	return &typescriptBanTsCommentRule{context: context}
}
