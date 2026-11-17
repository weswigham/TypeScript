package helpers

import (
	"slices"

	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

func RenderRegExpLiteral(pattern, flags string) string {
	if pattern == "" {
		pattern = "(?:)"
	}
	parsed := scanner.ParseRegExpLint(pattern, flags)
	type edit struct {
		start, end int
		text       string
	}
	var edits []edit
	parsed.Walk(func(node *scanner.RegExpLintNode, entering bool) {
		if !entering || node.Kind != scanner.RegExpLintCharacter {
			return
		}
		raw := pattern[node.Start:node.End]
		replacement := ""
		switch raw {
		case "\n", "\\\n":
			replacement = `\n`
		case "\r", "\\\r":
			replacement = `\r`
		case "\t", "\\\t":
			replacement = `\t`
		case "\v", "\\\v":
			replacement = `\v`
		case "\f", "\\\f":
			replacement = `\f`
		case "/":
			replacement = `\/`
		}
		if replacement != "" {
			edits = append(edits, edit{node.Start, node.End, replacement})
		}
	})
	for _, change := range slices.Backward(edits) {
		pattern = pattern[:change.start] + change.text + pattern[change.end:]
	}
	return "/" + pattern + "/" + flags
}
