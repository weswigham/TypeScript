package rules

import (
	"regexp"
	"strings"
	"unicode/utf16"
	"unicode/utf8"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/astnav"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type noWarningCommentsRule struct {
	context Context
}

func newNoWarningComments(context Context) Rule {
	rule := &noWarningCommentsRule{
		context: context,
	}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindSourceFile},
	}
}

func (rule *noWarningCommentsRule) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindSourceFile {
		rule.checkWarningComments(node)
		return false
	}
	return true
}

func (rule *noWarningCommentsRule) checkWarningComments(node *ast.Node) {
	terms := []string{"todo", "fixme", "xxx"}
	location, decoration := "start", ""
	if len(rule.context.Options) > 0 {
		if options, ok := rule.context.Options[0].(map[string]any); ok {
			terms = warningCommentTerms(options["terms"], terms)
			if value, ok := options["location"].(string); ok {
				location = value
			}
			decoration = strings.Join(warningCommentTerms(options["decoration"], nil), "")
		}
	}
	patterns := make([]*regexp.Regexp, len(terms))
	for index, term := range terms {
		patterns[index] = regexp.MustCompile("(?i)" + regexp.QuoteMeta(term))
	}
	selfConfig := regexp.MustCompile(`\bno-warning-comments\b`)
	directive := regexp.MustCompile(`^(?:eslint[- ]|(?:globals?|exported) )`)
	text := rule.context.File.Text()
	for position := 0; position <= len(text); {
		cursor := scanner.GetScannerForSourceFile(rule.context.File, position)
		atEnd := cursor.Scan() == ast.KindEndOfFile
		start := cursor.TokenStart()
		if atEnd {
			start = len(text)
		}
		lexer := scanner.NewScanner()
		lexer.SetText(text[position:start])
		lexer.SetSkipTrivia(false)
		for kind := lexer.Scan(); kind != ast.KindEndOfFile; kind = lexer.Scan() {
			if kind != ast.KindSingleLineCommentTrivia && kind != ast.KindMultiLineCommentTrivia {
				continue
			}
			commentStart, commentEnd := position+lexer.TokenStart(), position+lexer.TokenEnd()
			valueEnd := commentEnd
			if kind == ast.KindMultiLineCommentTrivia && strings.HasSuffix(text[commentStart:commentEnd], "*/") {
				valueEnd -= 2
			}
			value := text[commentStart+2 : valueEnd]
			trimmed := strings.TrimFunc(value, helpers.IsECMAScriptWhitespace)
			if selfConfig.MatchString(value) && (kind == ast.KindSingleLineCommentTrivia && strings.HasPrefix(trimmed, "eslint-") || kind == ast.KindMultiLineCommentTrivia && directive.MatchString(trimmed)) {
				continue
			}
			for index, pattern := range patterns {
				term := terms[index]
				first, _ := utf8.DecodeRuneInString(term)
				last, _ := utf8.DecodeLastRuneInString(term)
				matched := false
				for _, match := range pattern.FindAllStringIndex(value, -1) {
					if location == "start" {
						if strings.TrimFunc(value[:match[0]], func(character rune) bool {
							return helpers.IsECMAScriptWhitespace(character) || strings.ContainsRune(decoration, character)
						}) != "" {
							continue
						}
					} else if warningCommentWordCharacter(first) && match[0] > 0 {
						previous, _ := utf8.DecodeLastRuneInString(value[:match[0]])
						if warningCommentFoldedWordCharacter(previous) {
							continue
						}
					}
					if warningCommentWordCharacter(last) && match[1] < len(value) {
						next, _ := utf8.DecodeRuneInString(value[match[1]:])
						if warningCommentFoldedWordCharacter(next) {
							continue
						}
					}
					matched = true
					break
				}
				if !matched {
					continue
				}
				display := ""
				for _, word := range strings.FieldsFunc(trimmed, helpers.IsECMAScriptWhitespace) {
					candidate := word
					if display != "" {
						candidate = display + " " + word
					}
					if len(utf16.Encode([]rune(candidate))) > 40 {
						display += "..."
						break
					}
					display = candidate
				}
				rule.context.Report(core.NewTextRange(commentStart, commentEnd), diagnostics.Unexpected_0_comment_Colon_1, term, display)
			}
		}
		if atEnd {
			break
		}
		token := astnav.GetTokenAtPosition(rule.context.File, start)
		if token.End() <= position {
			break
		}
		position = token.End()
	}
}

func warningCommentWordCharacter(character rune) bool {
	return character >= 'a' && character <= 'z' || character >= 'A' && character <= 'Z' || character >= '0' && character <= '9' || character == '_'
}

func warningCommentFoldedWordCharacter(character rune) bool {
	return warningCommentWordCharacter(character) || character == '\u017f' || character == '\u212a'
}

func warningCommentTerms(value any, fallback []string) []string {
	switch value := value.(type) {
	case []string:
		return value
	case []any:
		result := make([]string, 0, len(value))
		for _, item := range value {
			if text, ok := item.(string); ok {
				result = append(result, text)
			}
		}
		return result
	}
	return fallback
}
