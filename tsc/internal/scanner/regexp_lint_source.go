package scanner

import (
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/stringutil"
)

type RegExpLintSourceRange struct{ Start, End int }

func RegExpLintStringSource(raw string) (string, []RegExpLintSourceRange) {
	lexer := NewScanner()
	lexer.SetText(raw)
	lexer.pos = 1
	var decoded strings.Builder
	var ranges []RegExpLintSourceRange
	for lexer.pos < len(raw)-1 {
		start := lexer.pos
		value := ""
		if raw[start] == '\\' {
			value = lexer.scanEscapeSequence(EscapeSequenceScanningFlagsString)
		} else if raw[0] == '`' && raw[start] == '\r' {
			lexer.pos++
			if lexer.pos < len(raw)-1 && raw[lexer.pos] == '\n' {
				lexer.pos++
			}
			value = "\n"
		} else {
			_, size := stringutil.DecodeJSStringRune(raw[start:])
			lexer.pos += size
			value = raw[start:lexer.pos]
		}
		decoded.WriteString(value)
		for range len(value) {
			ranges = append(ranges, RegExpLintSourceRange{Start: start, End: lexer.pos})
		}
	}
	return decoded.String(), ranges
}
