package rules

import (
	"strings"
	"unicode"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type capitalizedCommentsRule struct {
	context Context
}

func (rule *capitalizedCommentsRule) OnEnterNode(node *ast.Node) bool {
	if node.Kind != ast.KindSourceFile {
		return true
	}
	text := rule.context.File.Text()
	comments := helpers.SyntaxComments(rule.context, 0, len(text))
	for index, comment := range comments {
		options := helpers.SyntaxObject(rule.context, 1)
		which := "line"
		if comment.Kind == ast.KindMultiLineCommentTrivia {
			which = "block"
		}
		if override, ok := options[which].(map[string]any); ok {
			options = override
		}
		if helpers.MatchesRegularExpression(`^\s*(?:eslint|jshint\s+|jslint\s+|istanbul\s+|globals?\s+|exported\s+|jscs)`, comment.Text) {
			continue
		}
		clean := strings.ReplaceAll(comment.Text, "*", "")
		if pattern := helpers.StringOptionValue(options["ignorePattern"], ""); pattern != "" && helpers.MatchesRegularExpression(`^\s*(?:`+pattern+`)`, clean) {
			continue
		}
		if helpers.MatchesRegularExpression(`^\s*[^:/?#\s]+://[^?#]`, clean) {
			continue
		}
		if helpers.BooleanOptionValue(options, "ignoreConsecutiveComments", false) && index > 0 && strings.TrimSpace(text[comments[index-1].End:comment.Start]) == "" {
			continue
		}
		if helpers.BooleanOptionValue(options, "ignoreInlineComments", false) && comment.Kind == ast.KindMultiLineCommentTrivia {
			lineStart := strings.LastIndexAny(text[:comment.Start], "\r\n") + 1
			lineEnd := strings.IndexAny(text[comment.End:], "\r\n")
			if lineEnd < 0 {
				lineEnd = len(text) - comment.End
			}
			if strings.TrimSpace(text[lineStart:comment.Start]) != "" && strings.TrimSpace(text[comment.End:comment.End+lineEnd]) != "" {
				continue
			}
		}
		first := rune(0)
		for _, character := range clean {
			if !unicode.IsSpace(character) {
				first = character
				break
			}
		}
		if !unicode.IsLetter(first) {
			continue
		}
		always := helpers.StringOptionValue(helpers.SyntaxOption(rule.context, 0), "always") != "never"
		if always && unicode.ToUpper(first) == first || !always && unicode.ToLower(first) == first {
			continue
		}
		message := diagnostics.Comments_should_not_begin_with_a_lowercase_character
		if !always {
			message = diagnostics.Comments_should_not_begin_with_an_uppercase_character
		}
		rule.context.Report(
			core.NewTextRange(comment.Start, comment.End), message)

	}
	return true
}

func (rule *capitalizedCommentsRule) OnExitNode(node *ast.Node) {
}

func newCapitalizedComments(context Context) Rule {
	return &capitalizedCommentsRule{context: context}
}
