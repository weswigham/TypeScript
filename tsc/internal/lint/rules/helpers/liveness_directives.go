package helpers

import (
	"strings"
	"unicode"
	"unicode/utf8"

	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type UsageGlobal struct {
	Name                     string
	Location                 core.TextRange
	Used, Declared, Disabled bool
}

func (model *UsageModel) directives() (map[string]*UsageGlobal, map[string]bool) {
	globals := make(map[string]*UsageGlobal)
	exported := make(map[string]bool)
	file := model.context.File
	space := func(character rune) bool { return unicode.IsSpace(character) || character == '\ufeff' }
	for location := range scanner.GetCommentRanges(file) {
		if file.Text()[location.Pos()+1] != '*' {
			continue
		}
		start := location.Pos() + 2
		text := strings.TrimSuffix(file.Text()[start:location.End()], "*/")
		label := strings.TrimLeftFunc(text, space)
		start += len(text) - len(label)
		end := strings.IndexFunc(label, space)
		if end < 0 {
			continue
		}
		kind := label[:end]
		if kind != "global" && kind != "globals" && kind != "exported" {
			continue
		}
		text = label[end:]
		start += end
		for position := 0; position < len(text); {
			for position < len(text) {
				character, size := utf8.DecodeRuneInString(text[position:])
				if !space(character) && character != ',' {
					break
				}
				position += size
			}
			if position == len(text) || strings.HasPrefix(text[position:], "--") {
				break
			}
			nameStart := position
			for position < len(text) {
				character, size := utf8.DecodeRuneInString(text[position:])
				if space(character) || character == ',' || character == ':' {
					break
				}
				position += size
			}
			name := text[nameStart:position]
			nameEnd := position
			for position < len(text) {
				character, size := utf8.DecodeRuneInString(text[position:])
				if !space(character) {
					break
				}
				position += size
			}
			mode := ""
			if position < len(text) && text[position] == ':' {
				position++
				for position < len(text) {
					character, size := utf8.DecodeRuneInString(text[position:])
					if !space(character) {
						break
					}
					position += size
				}
				modeStart := position
				for position < len(text) {
					character, size := utf8.DecodeRuneInString(text[position:])
					if space(character) || character == ',' {
						break
					}
					position += size
				}
				mode = text[modeStart:position]
			}
			if name == "" {
				position++
				continue
			}
			if kind == "exported" {
				exported[name] = true
				continue
			}
			if mode != "" && mode != "true" && mode != "false" && mode != "readonly" && mode != "readable" && mode != "writable" && mode != "writeable" && mode != "off" {
				continue
			}
			global := globals[name]
			if global == nil {
				global = &UsageGlobal{Name: name, Location: core.NewTextRange(start+nameStart, start+nameEnd)}
				globals[name] = global
				model.Globals = append(model.Globals, global)
			}
			global.Disabled = mode == "off"
		}
	}
	return globals, exported
}
