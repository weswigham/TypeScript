package helpers

import (
	"unicode"
)

func TsCommentSpace(character rune) bool {
	switch character {
	case '\t', '\v', '\f', '\n', '\r', '\u2028', '\u2029', '\uFEFF':
		return true
	}
	return unicode.Is(unicode.Zs, character)
}
