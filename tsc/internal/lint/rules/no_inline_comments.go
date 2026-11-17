package rules

import (
	"regexp"
	"slices"
	"strings"
	"unicode/utf8"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/regex"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type noInlineComments struct {
	context  Context
	jsxEmpty []*ast.Node
}

func newNoInlineComments(context Context) Rule { return &noInlineComments{context: context} }

func (rule *noInlineComments) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindJsxExpression && node.Expression() == nil {
		rule.jsxEmpty = append(rule.jsxEmpty, node)
	}
	return true
}

func (rule *noInlineComments) OnExitNode(node *ast.Node) {
	if node.Kind == ast.KindSourceFile {
		rule.checkText(node)
	}
}

func (rule *noInlineComments) Options() map[string]any {
	if len(rule.context.Options) > 0 {
		options, _ := rule.context.Options[0].(map[string]any)
		return options
	}
	return nil
}

var inlineCommentDirective = regexp.MustCompile(`^(?:eslint(?:-env|-disable(?:-next-line|-line)?|-enable)?|globals?|exported)(?:\s|$)`)

func (rule *noInlineComments) checkText(node *ast.Node) {
	text := rule.context.File.Text()
	var comments []core.TextRange
	for comment := range scanner.GetCommentRanges(rule.context.File) {
		comments = append(comments, comment)
	}

	var ignore *regex.Pattern
	if pattern, ok := rule.Options()["ignorePattern"].(string); ok {
		ignore = regex.Compile(pattern)
	}
	for _, comment := range comments {
		value := text[comment.Pos()+2 : comment.End()]
		if strings.HasPrefix(text[comment.Pos():], "/*") {
			value = strings.TrimSuffix(value, "*/")
		}
		if inlineCommentDirective.MatchString(strings.TrimSpace(value)) || ignore != nil && ignore.MatchString(value) {
			continue
		}
		lineStart := strings.LastIndexAny(text[:comment.Pos()], "\r\n\u2028\u2029") + 1
		for lineStart < comment.Pos() && !utf8.RuneStart(text[lineStart]) {
			lineStart++
		}
		lineEnd := len(text)
		if offset := strings.IndexAny(text[comment.End():], "\r\n\u2028\u2029"); offset >= 0 {
			lineEnd = comment.End() + offset
		}
		before := strings.TrimSpace(text[lineStart:comment.Pos()])
		after := strings.TrimSpace(text[comment.End():lineEnd])
		if before == "" && after == "" {
			continue
		}
		if (before == "" || before == "{") && (after == "" || after == "}") && slices.ContainsFunc(rule.jsxEmpty, func(expression *ast.Node) bool {
			return expression.Pos() <= comment.Pos() && comment.End() <= expression.End()
		}) {
			continue
		}
		rule.context.Report(core.NewTextRange(comment.Pos(), comment.End()), diagnostics.Unexpected_comment_inline_with_code)
	}
}
