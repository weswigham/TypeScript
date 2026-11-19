package rules

import (
	"regexp"
	"strings"
	"unicode/utf8"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/astnav"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type typescriptBanTslintCommentRule struct {
	context Context
}

func newTypeScriptBanTslintComment(context Context) Rule {
	rule := &typescriptBanTslintCommentRule{context: context}

	return Rule{
		Enter: rule.OnEnterNode,
	}
}

func (rule *typescriptBanTslintCommentRule) OnEnterNode(node *ast.Node) bool {
	if node.Kind != ast.KindSourceFile {
		return false
	}
	cursor := scanner.GetScannerForSourceFile(rule.context.File, 0)
	cursor.SetSkipTrivia(true)
	tokenScanner := scanner.NewScanner()
	tokenScanner.SetText(rule.context.File.Text())
	tokenScanner.SetSkipTrivia(false)
	for position := 0; ; {
		cursor.ResetPos(position)
		atEnd := cursor.Scan() == ast.KindEndOfFile
		start := cursor.TokenStart()
		tokenScanner.ResetPos(position)
		for tokenScanner.TokenEnd() < start {
			kind := tokenScanner.Scan()
			if kind == ast.KindSingleLineCommentTrivia || kind == ast.KindMultiLineCommentTrivia {
				rule.checkComment(tokenScanner.TokenStart(), tokenScanner.TokenEnd(), kind)
			}
			if kind == ast.KindEndOfFile {
				break
			}
		}
		if atEnd {
			break
		}
		token := astnav.GetTokenAtPosition(rule.context.File, start)
		if token == nil || token.End() <= position {
			break
		}
		position = token.End()
	}
	return false
}

var (
	tsTslintCommentDetected = diagnostics.X_tslint_comment_detected_Colon_0
	tsTslintDirective       = regexp.MustCompile(`^tslint:(enable|disable)(?:-(line|next-line))?`)
)

func (rule *typescriptBanTslintCommentRule) checkComment(start int, end int, kind ast.Kind) {
	text := rule.context.File.Text()
	valueEnd := end
	if kind == ast.KindMultiLineCommentTrivia && strings.HasSuffix(text[start:end], "*/") {
		valueEnd -= 2
	}
	value := strings.TrimLeftFunc(text[start+2:valueEnd], helpers.TsCommentSpace)
	match := tsTslintDirective.FindStringIndex(value)
	if match == nil {
		return
	}
	if match[1] < len(value) {
		character, _ := utf8.DecodeRuneInString(value[match[1]:])
		if character != ':' && !helpers.TsCommentSpace(character) {
			return
		}
	}
	value = strings.TrimFunc(value, helpers.TsCommentSpace)
	comment := "// " + value
	if kind == ast.KindMultiLineCommentTrivia {
		comment = "/* " + value + " */"
	}
	diagnostic := rule.context.Report(
		core.NewTextRange(start, end), tsTslintCommentDetected, comment)

	removeStart, removeEnd := start, end
	if start > 0 {
		character, width := utf8.DecodeLastRuneInString(text[:start])
		if character != '\n' && character != '\r' && character != '\u2028' && character != '\u2029' {
			removeStart -= width
		}
	}
	if end < len(text) {
		_, width := utf8.DecodeRuneInString(text[end:])
		removeEnd += width
	}
	tracker := rule.context.NewTracker()
	tracker.DeleteRange(rule.context.File, core.NewTextRange(removeStart, removeEnd))
	const name = "@typescript-eslint/ban-tslint-comment"
	diagnostic.SetCodeFixes(codefix.CreateCodeFixAction(name, tracker.GetTextChanges(), ast.NewCompilerDiagnostic(diagnostics.Remove_TSLint_comment), name, ast.NewCompilerDiagnostic(diagnostics.Remove_TSLint_comments)))
}
