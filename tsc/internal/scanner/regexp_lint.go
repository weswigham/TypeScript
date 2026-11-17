package scanner

import (
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
)

func RegExpEmptyCharacterClasses(pattern, flags string) int {
	unicodeMode := strings.ContainsAny(flags, "uv")
	unicodeSets := strings.Contains(flags, "v")
	depth := 0
	count := 0
	named := false
	for index := 0; index < len(pattern); index++ {
		switch pattern[index] {
		case '\\':
			index++
		case '[':
			if depth == 0 || unicodeSets {
				depth++
				if index+1 < len(pattern) && pattern[index+1] == ']' {
					count++
				}
			}
		case ']':
			if depth > 0 {
				depth--
			}
		case '(':
			if depth == 0 && strings.HasPrefix(pattern[index:], "(?<") && index+3 < len(pattern) && pattern[index+3] != '=' && pattern[index+3] != '!' {
				named = true
			}
		}
	}
	if count == 0 {
		return 0
	}
	if !unicodeMode {
		pattern = regExpLintAnnexB(pattern, named)
	}
	lexer := NewScanner()
	lexer.SetText(pattern)
	valid := true
	lexer.SetOnError(func(message *diagnostics.Message, pos, length int, args ...any) {
		if !unicodeMode {
			switch message {
			case diagnostics.Octal_escape_sequences_are_not_allowed_Use_the_syntax_0,
				diagnostics.Octal_escape_sequences_and_backreferences_are_not_allowed_in_a_character_class_If_this_was_intended_as_an_escape_sequence_use_the_syntax_0_instead,
				diagnostics.Decimal_escape_sequences_and_backreferences_are_not_allowed_in_a_character_class,
				diagnostics.This_backreference_refers_to_a_group_that_does_not_exist_There_are_only_0_capturing_groups_in_this_regular_expression,
				diagnostics.This_backreference_refers_to_a_group_that_does_not_exist_There_are_no_capturing_groups_in_this_regular_expression:
				return
			}
		}
		valid = false
	})
	parser := regExpParser{
		scanner:            lexer,
		end:                len(pattern),
		anyUnicodeMode:     unicodeMode,
		unicodeSetsMode:    unicodeSets,
		annexB:             true,
		namedCaptureGroups: named,
		groupSpecifiers:    make(map[string]bool),
	}
	parser.run()
	if !valid || parser.pos() != len(pattern) {
		return 0
	}
	return count
}

func regExpLintAnnexB(pattern string, named bool) string {
	var normalized strings.Builder
	inClass := false
	for index := 0; index < len(pattern); index++ {
		character := pattern[index]
		if character == '\\' && index+1 < len(pattern) {
			escaped := pattern[index+1]
			if escaped == 'p' || escaped == 'P' || escaped == 'x' && !regExpLintHasHexDigits(pattern, index+2, 2) || escaped == 'u' && !regExpLintHasHexDigits(pattern, index+2, 4) {
				normalized.WriteString(`\x`)
				normalized.WriteByte("0123456789abcdef"[escaped>>4])
				normalized.WriteByte("0123456789abcdef"[escaped&15])
			} else if escaped == 'k' && !inClass && !named {
				normalized.WriteString(`\x6b`)
			} else if escaped == 'c' && inClass && (index+2 == len(pattern) || !isRegExpLintControlLetter(pattern[index+2])) {
				if index+2 < len(pattern) && (pattern[index+2] == '_' || pattern[index+2] >= '0' && pattern[index+2] <= '9') {
					control := pattern[index+2] & 0x1f
					normalized.WriteString(`\x`)
					normalized.WriteByte("0123456789abcdef"[control>>4])
					normalized.WriteByte("0123456789abcdef"[control&0xf])
					index++
				} else {
					normalized.WriteString(`\\c`)
				}
			} else {
				normalized.WriteByte(character)
				normalized.WriteByte(escaped)
			}
			index++
			continue
		}
		if character == '[' {
			inClass = true
		} else if character == ']' {
			inClass = false
		}
		normalized.WriteByte(character)
	}
	return normalized.String()
}

func isRegExpLintControlLetter(character byte) bool {
	return character >= 'a' && character <= 'z' || character >= 'A' && character <= 'Z'
}

func regExpLintHasHexDigits(pattern string, start, count int) bool {
	if start+count > len(pattern) {
		return false
	}
	for _, character := range pattern[start : start+count] {
		if !(character >= '0' && character <= '9' || character >= 'a' && character <= 'f' || character >= 'A' && character <= 'F') {
			return false
		}
	}
	return true
}
