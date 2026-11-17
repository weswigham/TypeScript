package rules

import (
	"strconv"
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type noRegexSpaces struct{ helpers.RegexSource }

func (rule *noRegexSpaces) OnEnterNode(node *ast.Node) bool {
	input := rule.DirectInput(node)
	if input == nil || !input.KnownFlags || !input.KnownPattern {
		return true
	}
	parsed := helpers.ParseRegexInput(input)
	if parsed.Valid {
		rule.spaces(input, parsed)
	}
	return true
}

func (rule *noRegexSpaces) spaces(input *helpers.RegexInput, parsed *scanner.RegExpLint) {
	if !strings.Contains(input.RawPattern, "  ") {
		return
	}
	classes := []*scanner.RegExpLintNode{}
	parsed.Walk(func(node *scanner.RegExpLintNode, entering bool) {
		if entering && node.Kind == scanner.RegExpLintClass {
			classes = append(classes, node)
		}
	})
	for index := 0; index+1 < len(input.Pattern); index++ {
		if input.Pattern[index] != ' ' || input.Pattern[index+1] != ' ' {
			continue
		}
		end := index + 2
		for end < len(input.Pattern) && input.Pattern[end] == ' ' {
			end++
		}
		length := end - index
		if end < len(input.Pattern) && strings.ContainsRune("+*{?", rune(input.Pattern[end])) {
			length--
		}
		if length < 2 {
			index = end - 1
			continue
		}
		inside := false
		for _, class := range classes {
			inside = inside || class.Start <= index && index < class.End
		}
		if inside {
			index = end - 1
			continue
		}
		diagnostic := rule.Context.Report(rule.Context.Range(input.Node), diagnostics.Spaces_are_hard_to_count_Use_0, strconv.Itoa(length))
		if input.Pattern == input.RawPattern {
			rule.Edit(diagnostic, "no-regex-spaces", input.Start+index, input.Start+index+length, " {"+strconv.Itoa(length)+"}", ast.NewCompilerDiagnostic(diagnostics.Replace_spaces_with_a_quantifier), false)
		}
		return
	}
}

func newNoRegexSpaces(context Context) Rule {
	return &noRegexSpaces{RegexSource: helpers.NewRegexSource(context)}
}
