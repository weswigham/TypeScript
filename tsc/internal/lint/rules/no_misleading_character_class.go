package rules

import (
	"strings"
	"unicode"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type noMisleadingCharacterClass struct {
	helpers.RegexSource
	checked map[*ast.Node]bool
}

func (rule *noMisleadingCharacterClass) OnEnterNode(node *ast.Node) bool {
	input := rule.Input(node)
	if input == nil || rule.checked[node] {
		return true
	}
	if !input.Literal && input.PatternNode != nil && input.PatternNode.Kind == ast.KindRegularExpressionLiteral && input.FlagsNode != nil {
		literal := rule.Input(input.PatternNode)
		input.Pattern, input.RawPattern, input.Start, input.KnownPattern = literal.Pattern, literal.Pattern, literal.Start, true
		if rule.checked == nil {
			rule.checked = make(map[*ast.Node]bool)
		}
		rule.checked[input.PatternNode] = true
	}
	if !input.KnownFlags || !input.KnownPattern {
		return true
	}
	parsed := helpers.ParseRegexInput(input)
	if parsed.Valid {
		rule.misleading(input, parsed)
	}
	return true
}

func (rule *noMisleadingCharacterClass) misleading(input *helpers.RegexInput, parsed *scanner.RegExpLint) {
	messages := []*diagnostics.Message{diagnostics.Unexpected_surrogate_pair_in_character_class_Use_u_flag, diagnostics.Unexpected_surrogate_pair_in_character_class, diagnostics.Unexpected_combined_character_in_character_class, diagnostics.Unexpected_modified_Emoji_in_character_class, diagnostics.Unexpected_national_flag_in_character_class, diagnostics.Unexpected_joined_character_sequence_in_character_class}
	type match struct{ first, last *scanner.RegExpLintNode }
	found := make([][]match, len(messages))
	check := func(characters []*scanner.RegExpLintNode) {
		acceptable := func(node *scanner.RegExpLintNode) bool {
			if !rule.Option("allowEscape") {
				return false
			}
			raw := input.Pattern[node.Start:node.End]
			if start, end, ok := rule.PatternRange(input, node.Start, node.End); ok {
				raw = rule.Context.File.Text()[start:end]
			}
			return strings.HasPrefix(raw, `\`) && strings.TrimLeft(raw, `\`) != string(node.Value)
		}
		for index := 1; index < len(characters); index++ {
			previous, current := characters[index-1], characters[index]
			if acceptable(current) {
				continue
			}
			if !acceptable(previous) && previous.Value >= 0xd800 && previous.Value <= 0xdbff && current.Value >= 0xdc00 && current.Value <= 0xdfff {
				kind := 0
				if strings.HasPrefix(input.Pattern[previous.Start:previous.End], `\u{`) || strings.HasPrefix(input.Pattern[current.Start:current.End], `\u{`) {
					kind = 1
				}
				found[kind] = append(found[kind], match{previous, current})
			}
			if regexCombiningCharacter(current.Value) && !regexCombiningCharacter(previous.Value) {
				found[2] = append(found[2], match{previous, current})
			}
			if !acceptable(previous) && regexEmojiModifier(current.Value) && !regexEmojiModifier(previous.Value) {
				found[3] = append(found[3], match{previous, current})
			}
			if !acceptable(previous) && regexRegionalIndicator(current.Value) && regexRegionalIndicator(previous.Value) {
				found[4] = append(found[4], match{previous, current})
			}
			if !acceptable(previous) && current.Value == 0x200d && previous.Value != 0x200d && index+1 < len(characters) && characters[index+1].Value != 0x200d && !acceptable(characters[index+1]) {
				last := characters[index+1]
				matches := found[5]
				if len(matches) > 0 && matches[len(matches)-1].last == previous {
					found[5][len(matches)-1].last = last
				} else {
					found[5] = append(found[5], match{previous, last})
				}
			}
		}
	}
	parsed.Walk(func(node *scanner.RegExpLintNode, entering bool) {
		if !entering || node.Kind != scanner.RegExpLintClass {
			return
		}
		var sequence []*scanner.RegExpLintNode
		for _, child := range node.Children {
			switch child.Kind {
			case scanner.RegExpLintCharacter:
				sequence = append(sequence, child)
			case scanner.RegExpLintRange:
				sequence = append(sequence, child.Children[0])
				check(sequence)
				sequence = []*scanner.RegExpLintNode{child.Children[len(child.Children)-1]}
			default:
				check(sequence)
				sequence = nil
			}
		}
		check(sequence)
	})
	node := input.PatternNode
	if node == nil {
		node = input.Node
	}
	for kind, matches := range found {
		for index, match := range matches {
			granular := input.Literal || node.Kind == ast.KindRegularExpressionLiteral || node.Kind == ast.KindStringLiteral || node.Kind == ast.KindNoSubstitutionTemplateLiteral
			if !granular && index > 0 {
				break
			}
			diagnosticLocation := rule.Context.Range(node)
			if start, end, ok := rule.PatternRange(input, match.first.Start, match.last.End); granular && ok {
				diagnosticLocation = core.NewTextRange(start, end)
			}
			diagnostic := rule.Context.Report(diagnosticLocation, messages[kind])

			if kind == 0 {
				rule.FlagSuggestion(diagnostic, "no-misleading-character-class", input, "u", ast.NewCompilerDiagnostic(diagnostics.Add_unicode_u_flag_to_regex))
			}
		}
	}
}

func regexCombiningCharacter(value rune) bool {
	return unicode.Is(unicode.Mn, value) || unicode.Is(unicode.Mc, value) || unicode.Is(unicode.Me, value)
}

func regexEmojiModifier(value rune) bool { return value >= 0x1f3fb && value <= 0x1f3ff }

func regexRegionalIndicator(value rune) bool { return value >= 0x1f1e6 && value <= 0x1f1ff }

func newNoMisleadingCharacterClass(context Context) Rule {
	return &noMisleadingCharacterClass{RegexSource: helpers.NewRegexSource(context)}
}
