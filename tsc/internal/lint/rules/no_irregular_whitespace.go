package rules

import (
	"cmp"
	"slices"
	"strings"
	"unicode/utf8"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type noIrregularWhitespace struct {
	context Context
	atoms   []irregularWhitespaceAtom
}

func newNoIrregularWhitespace(context Context) Rule { return &noIrregularWhitespace{context: context} }

func (rule *noIrregularWhitespace) OnEnterNode(node *ast.Node) bool {
	rule.collectTextNode(node)

	return true
}

func (rule *noIrregularWhitespace) OnExitNode(node *ast.Node) {
	if node.Kind == ast.KindSourceFile {
		rule.checkText(node)
	}
}

func (rule *noIrregularWhitespace) Options() map[string]any {
	if len(rule.context.Options) > 0 {
		options, _ := rule.context.Options[0].(map[string]any)
		return options
	}
	return nil
}

func (rule *noIrregularWhitespace) Boolean(name string) bool {
	value, _ := rule.Options()[name].(bool)
	return value
}

func (rule *noIrregularWhitespace) collectTextNode(node *ast.Node) {
	ignored := false
	switch node.Kind {
	case ast.KindStringLiteral:
		ignored = rule.Options()["skipStrings"] != false
	case ast.KindRegularExpressionLiteral:
		ignored = rule.Boolean("skipRegExps")
	case ast.KindNoSubstitutionTemplateLiteral, ast.KindTemplateHead, ast.KindTemplateMiddle, ast.KindTemplateTail:
		ignored = rule.Boolean("skipTemplates")
	case ast.KindJsxText:
		ignored = rule.Boolean("skipJSXText")

	default:
		return
	}
	start := scanner.GetTokenPosOfNode(node, rule.context.File, false)
	if node.Kind == ast.KindJsxText {
		start = node.Pos()
	}
	rule.atoms = append(rule.atoms, irregularWhitespaceAtom{span: core.NewTextRange(start, node.End()), ignored: ignored})
}

func isIrregularWhitespace(character rune) bool {
	return character >= '\u2000' && character <= '\u200b' || strings.ContainsRune("\f\v\u0085\ufeff\u00a0\u1680\u180e\u202f\u205f\u3000\u2028\u2029", character)
}

type irregularWhitespaceAtom struct {
	span    core.TextRange
	ignored bool
}

func (rule *noIrregularWhitespace) checkText(node *ast.Node) {
	text := rule.context.File.Text()
	slices.SortFunc(rule.atoms, func(left, right irregularWhitespaceAtom) int { return cmp.Compare(left.span.Pos(), right.span.Pos()) })
	var comments []core.TextRange
	lexer := scanner.NewScanner()
	lexer.SetText(text)
	lexer.SetSkipTrivia(false)
	atomIndex := 0
	for position := 0; position < len(text); {
		for atomIndex < len(rule.atoms) && rule.atoms[atomIndex].span.End() <= position {
			atomIndex++
		}
		if atomIndex < len(rule.atoms) && rule.atoms[atomIndex].span.Pos() <= position {
			position = rule.atoms[atomIndex].span.End()
			lexer.ResetPos(position)
			continue
		}
		token := lexer.Scan()
		if token == ast.KindEndOfFile {
			break
		}
		if token == ast.KindSingleLineCommentTrivia || token == ast.KindMultiLineCommentTrivia {
			comments = append(comments, lexer.TokenRange())
		}
		position = lexer.TokenEnd()
	}

	ignored := make([]core.TextRange, 0, len(rule.atoms)+len(comments))
	for _, atom := range rule.atoms {
		if atom.ignored {
			ignored = append(ignored, atom.span)
		}
	}
	if rule.Boolean("skipComments") {
		ignored = append(ignored, comments...)
	}
	slices.SortFunc(ignored, func(left, right core.TextRange) int { return cmp.Compare(left.Pos(), right.Pos()) })
	ignoredIndex := 0
	for position := 0; position < len(text); {
		character, width := utf8.DecodeRuneInString(text[position:])
		if !isIrregularWhitespace(character) {
			position += width
			continue
		}
		start := position
		position += width
		if character != '\u2028' && character != '\u2029' {
			for position < len(text) {
				next, size := utf8.DecodeRuneInString(text[position:])
				if !isIrregularWhitespace(next) || next == '\u2028' || next == '\u2029' {
					break
				}
				position += size
			}
		}
		for ignoredIndex < len(ignored) && ignored[ignoredIndex].End() <= start {
			ignoredIndex++
		}
		if ignoredIndex < len(ignored) && ignored[ignoredIndex].Pos() <= start {
			continue
		}
		rule.context.Report(core.NewTextRange(start, position), diagnostics.Irregular_whitespace_not_allowed)
	}
}
