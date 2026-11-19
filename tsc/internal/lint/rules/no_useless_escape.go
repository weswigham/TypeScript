package rules

import (
	"strings"
	"unicode/utf8"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type noUselessEscape struct{ helpers.RegexSource }

func newNoUselessEscape(context Context) Rule {
	rule := &noUselessEscape{RegexSource: helpers.NewRegexSource(context)}

	return Rule{
		Enter: rule.OnEnterNode,
		EnterKinds: []ast.Kind{
			ast.KindRegularExpressionLiteral,
			ast.KindStringLiteral,
			ast.KindNoSubstitutionTemplateLiteral,
			ast.KindTemplateHead,
			ast.KindTemplateMiddle,
			ast.KindTemplateTail,
		},
		GetSuggestions: rule.Suggestions,
	}
}

func (rule *noUselessEscape) OnEnterNode(node *ast.Node) bool {
	if node.Kind != ast.KindRegularExpressionLiteral {
		rule.stringEscapes(node)
		return true
	}
	input := rule.Input(node)
	if input == nil || !input.KnownPattern {
		return true
	}
	parsed := helpers.ParseRegexInput(input)
	if parsed.Valid {
		rule.regexEscapes(input, parsed)
	}
	return true
}

func (rule *noUselessEscape) escapeReport(node *ast.Node, start int, character string, backslash bool) {
	diagnostic := rule.Context.Report(
		core.NewTextRange(start, start+1), diagnostics.Unnecessary_escape_character_Colon_0, character)

	message := diagnostics.Remove_the_This_maintains_the_current_functionality
	if node.Parent != nil && ast.IsPrologueDirective(node.Parent) {
		message = diagnostics.Remove_the_if_it_was_inserted_by_mistake
	}
	rule.Edit(diagnostic, "no-useless-escape", start, start+1, "", ast.NewCompilerDiagnostic(message), true)
	if backslash {
		rule.Edit(diagnostic, "no-useless-escape", start, start, `\`, ast.NewCompilerDiagnostic(diagnostics.Replace_the_with_to_include_the_actual_backslash_character), true)
	}
}

func (rule *noUselessEscape) regexEscapes(input *helpers.RegexInput, parsed *scanner.RegExpLint) {
	allowed := make(map[string]bool)
	if characters, ok := rule.Options()["allowRegexCharacters"].([]any); ok {
		for _, character := range characters {
			if text, ok := character.(string); ok {
				allowed[text] = true
			}
		}
	}
	parsed.Walk(func(node *scanner.RegExpLintNode, entering bool) {
		if !entering || node.Kind != scanner.RegExpLintCharacter {
			return
		}
		raw := input.Pattern[node.Start:node.End]
		if !strings.HasPrefix(raw, `\`) || raw[1:] != string(node.Value) || allowed[raw[1:]] {
			return
		}
		class := node.Parent
		for class != nil && class.Kind != scanner.RegExpLintClass {
			class = class.Parent
		}
		general := `\bcdDfnpPrsStvwWxu0123456789]`
		if class == nil {
			general += `^/.$*+?[{}|()Bk`
		} else if strings.Contains(input.Flags, "v") {
			general += `q/[{}|()-`
		}
		if strings.ContainsRune(general, node.Value) {
			return
		}
		if class != nil {
			if node.Value == '^' && node.Start == class.Start+1 {
				return
			}
			if !strings.Contains(input.Flags, "v") {
				if node.Value == '-' && node.Start != class.Start+1 && node.End != class.End-1 {
					return
				}
			} else if strings.ContainsRune("!#$%&*+,.:;<=>?@^`~", node.Value) {
				if node.End < len(input.Pattern) && rune(input.Pattern[node.End]) == node.Value {
					return
				}
				if node.Start > 0 && rune(input.Pattern[node.Start-1]) == node.Value && (node.Value != '^' || !class.Negative || class.Start+1 < node.Start-1) {
					return
				}
			}
		}
		backslash := node.Parent == nil || node.Parent.Kind != scanner.RegExpLintIntersection && node.Parent.Kind != scanner.RegExpLintSubtraction
		rule.escapeReport(input.Node, input.Start+node.Start, string(node.Value), backslash)
	})
}

func (rule *noUselessEscape) stringEscapes(node *ast.Node) {
	template := node.Kind == ast.KindNoSubstitutionTemplateLiteral || node.Kind == ast.KindTemplateHead || node.Kind == ast.KindTemplateMiddle || node.Kind == ast.KindTemplateTail
	if node.Kind != ast.KindStringLiteral && !template {
		return
	}
	if node.Parent != nil && (node.Parent.Kind == ast.KindJsxAttribute || node.Parent.Kind == ast.KindJsxElement || node.Parent.Kind == ast.KindJsxFragment) {
		return
	}
	if template {
		for parent := node.Parent; parent != nil; parent = parent.Parent {
			if parent.Kind == ast.KindTaggedTemplateExpression {
				return
			}
			if parent.Kind != ast.KindTemplateExpression && parent.Kind != ast.KindTemplateSpan {
				break
			}
		}
	}
	raw := rule.Text(node)
	for index := 1; index+1 < len(raw); index++ {
		if raw[index] != '\\' {
			continue
		}
		character, size := utf8.DecodeRuneInString(raw[index+1:])
		unnecessary := !strings.ContainsRune("\\nrvtbfux\r\n\u2028\u2029", character) && (character < '0' || character > '9')
		if template {
			if character == '`' {
				unnecessary = false
			}
			if character == '$' {
				unnecessary = index+2 >= len(raw) || raw[index+2] != '{'
			}
			if character == '{' {
				unnecessary = raw[index-1] != '$'
			}
		} else if character == rune(raw[0]) {
			unnecessary = false
		}
		if unnecessary {
			rule.escapeReport(node, rule.Start(node)+index, string(character), true)
		}
		index += size
	}
}
