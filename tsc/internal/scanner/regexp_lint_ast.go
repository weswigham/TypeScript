package scanner

import (
	"strconv"
	"strings"
	"unicode/utf16"

	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/stringutil"
)

type RegExpLintKind uint8

const (
	RegExpLintPattern RegExpLintKind = iota
	RegExpLintAlternative
	RegExpLintGroup
	RegExpLintCapture
	RegExpLintAssertion
	RegExpLintClass
	RegExpLintRange
	RegExpLintCharacter
	RegExpLintSet
	RegExpLintBackreference
	RegExpLintQuantifier
	RegExpLintClassStrings
	RegExpLintClassString
	RegExpLintIntersection
	RegExpLintSubtraction
)

type RegExpLintNode struct {
	Kind             RegExpLintKind
	Start, End       int
	Parent           *RegExpLintNode
	Children         []*RegExpLintNode
	Value            rune
	Name             string
	Index            int
	Negative, Behind bool
	Min, Max         int
	References       []*RegExpLintNode
}

type RegExpLint struct {
	Pattern, Flags           string
	Valid                    bool
	Error                    string
	ErrorPos                 int
	Root                     *RegExpLintNode
	Captures, Backreferences []*RegExpLintNode
}

func (expression *RegExpLint) Walk(visitor func(*RegExpLintNode, bool)) {
	var walk func(*RegExpLintNode)
	walk = func(node *RegExpLintNode) {
		visitor(node, true)
		for _, child := range node.Children {
			walk(child)
		}
		visitor(node, false)
	}
	walk(expression.Root)
}

func ParseRegExpLint(pattern, flags string) *RegExpLint {
	result := &RegExpLint{Pattern: pattern, Flags: flags, Valid: true}
	seen := make(map[rune]bool)
	for _, flag := range flags {
		if !strings.ContainsRune("dgimsuvy", flag) || seen[flag] {
			result.Valid, result.Error = false, "Invalid flags supplied to RegExp constructor '"+flags+"'"
		}
		seen[flag] = true
	}
	if seen['u'] && seen['v'] {
		result.Valid, result.Error = false, "Invalid regular expression flags"
	}
	captureCount, hasNames := regExpLintCaptureInfo(pattern, seen['v'])
	reader := regExpLintReader{result: result, unicode: seen['u'] || seen['v'], sets: seen['v'], captureCount: captureCount, named: hasNames}
	result.Root = &RegExpLintNode{Kind: RegExpLintPattern, End: len(pattern)}
	reader.disjunction(result.Root)
	for _, reference := range result.Backreferences {
		for _, capture := range result.Captures {
			if reference.Name != "" && capture.Name == reference.Name || reference.Name == "" && capture.Index == reference.Index {
				reference.References = append(reference.References, capture)
			}
		}
	}
	if !result.Valid {
		return result
	}
	normalized := pattern
	named := false
	for _, capture := range result.Captures {
		named = named || capture.Name != ""
	}
	if !reader.unicode {
		normalized = regExpLintAnnexB(pattern, named)
	}
	var validation strings.Builder
	classDepth := 0
	for index := 0; index < len(normalized); index++ {
		if normalized[index] == '\\' && index+1 < len(normalized) {
			validation.WriteString(normalized[index : index+2])
			index++
		} else {
			if normalized[index] == '[' && (classDepth == 0 || reader.sets) {
				classDepth++
			}
			if normalized[index] == ']' && classDepth > 0 {
				classDepth--
			}
			if normalized[index] == '/' && (!reader.sets || classDepth == 0) {
				validation.WriteString(`\x2f`)
			} else {
				validation.WriteByte(normalized[index])
			}
		}
	}
	normalized = validation.String()
	lexer := NewScanner()
	lexer.SetScriptTarget(core.ScriptTargetESNext)
	lexer.SetText(normalized)
	lexer.SetOnError(func(message *diagnostics.Message, pos, length int, args ...any) {
		if !reader.unicode {
			switch message {
			case diagnostics.Octal_escape_sequences_are_not_allowed_Use_the_syntax_0,
				diagnostics.Octal_escape_sequences_and_backreferences_are_not_allowed_in_a_character_class_If_this_was_intended_as_an_escape_sequence_use_the_syntax_0_instead,
				diagnostics.Decimal_escape_sequences_and_backreferences_are_not_allowed_in_a_character_class,
				diagnostics.This_backreference_refers_to_a_group_that_does_not_exist_There_are_only_0_capturing_groups_in_this_regular_expression,
				diagnostics.This_backreference_refers_to_a_group_that_does_not_exist_There_are_no_capturing_groups_in_this_regular_expression:
				return
			}
		}
		if result.Valid {
			result.Error, result.ErrorPos = regExpLintSyntaxError(message, args...), pos
		}
		result.Valid = false
	})
	parser := regExpParser{scanner: lexer, end: len(normalized), anyUnicodeMode: reader.unicode, unicodeSetsMode: reader.sets, annexB: true, namedCaptureGroups: named, groupSpecifiers: make(map[string]bool)}
	parser.run()
	if parser.pos() != len(normalized) {
		result.Valid, result.Error = false, "Unmatched ')'"
	}
	return result
}

func regExpLintSyntaxError(message *diagnostics.Message, args ...any) string {
	switch message {
	case diagnostics.X_0_expected:
		if len(args) > 0 {
			switch args[0] {
			case "]":
				return "Unterminated character class"
			case ")":
				return "Unterminated group"
			case "}":
				return "Incomplete quantifier"
			case ">":
				return "Invalid capture group name"
			}
		}
	case diagnostics.There_is_nothing_available_for_repetition:
		return "Nothing to repeat"
	case diagnostics.Numbers_out_of_order_in_quantifier:
		return "numbers out of order in {} quantifier"
	case diagnostics.Incomplete_quantifier_Digit_expected:
		return "Incomplete quantifier"
	case diagnostics.Unexpected_0_Did_you_mean_to_escape_it_with_backslash:
		if len(args) > 0 && args[0] == ")" {
			return "Unmatched ')'"
		}
		return "Lone quantifier brackets"
	case diagnostics.Undetermined_character_escape:
		return `\ at end of pattern`
	case diagnostics.X_c_must_be_followed_by_an_ASCII_letter:
		return "Invalid unicode escape"
	case diagnostics.Named_capturing_groups_with_the_same_name_must_be_mutually_exclusive_to_each_other:
		return "Duplicate capture group name"
	case diagnostics.Expected_a_capturing_group_name:
		return "Invalid capture group name"
	case diagnostics.X_k_must_be_followed_by_a_capturing_group_name_enclosed_in_angle_brackets:
		return "Invalid named reference"
	case diagnostics.Range_out_of_order_in_character_class:
		return "Range out of order in character class"
	case diagnostics.There_is_no_capturing_group_named_0_in_this_regular_expression:
		return "Invalid named capture referenced"
	case diagnostics.This_backreference_refers_to_a_group_that_does_not_exist_There_are_only_0_capturing_groups_in_this_regular_expression,
		diagnostics.This_backreference_refers_to_a_group_that_does_not_exist_There_are_no_capturing_groups_in_this_regular_expression:
		return "Invalid escape"
	}
	return "Invalid escape"
}

type regExpLintReader struct {
	result        *RegExpLint
	pos           int
	unicode, sets bool
	captureCount  int
	named         bool
}

func (reader *regExpLintReader) add(parent *RegExpLintNode, kind RegExpLintKind, start int) *RegExpLintNode {
	node := &RegExpLintNode{Kind: kind, Start: start, End: reader.pos, Parent: parent}
	parent.Children = append(parent.Children, node)
	return node
}

func (reader *regExpLintReader) at(text string) bool {
	return strings.HasPrefix(reader.result.Pattern[reader.pos:], text)
}

func (reader *regExpLintReader) disjunction(parent *RegExpLintNode) {
	for {
		alternative := reader.add(parent, RegExpLintAlternative, reader.pos)
		for reader.pos < len(reader.result.Pattern) && !reader.at("|") && !reader.at(")") {
			start := reader.pos
			var node *RegExpLintNode
			switch reader.result.Pattern[reader.pos] {
			case '(':
				reader.pos++
				node = reader.add(alternative, RegExpLintCapture, start)
				if reader.at("?") {
					reader.pos++
					node.Kind = RegExpLintGroup
					switch {
					case reader.at("=") || reader.at("!"):
						node.Kind, node.Negative = RegExpLintAssertion, reader.at("!")
						reader.pos++
					case reader.at("<=") || reader.at("<!"):
						node.Kind, node.Behind, node.Negative = RegExpLintAssertion, true, reader.at("<!")
						reader.pos += 2
					case reader.at("<"):
						reader.pos++
						nameStart := reader.pos
						for reader.pos < len(reader.result.Pattern) && !reader.at(">") {
							reader.pos++
						}
						node.Kind, node.Name = RegExpLintCapture, regExpLintName(reader.result.Pattern[nameStart:reader.pos])
						if reader.pos < len(reader.result.Pattern) {
							reader.pos++
						}
					default:
						for reader.pos < len(reader.result.Pattern) && !reader.at(":") && !reader.at(")") {
							reader.pos++
						}
						if reader.at(":") {
							reader.pos++
						}
					}
				}
				if node.Kind == RegExpLintCapture {
					node.Index = len(reader.result.Captures) + 1
					reader.result.Captures = append(reader.result.Captures, node)
				}
				reader.disjunction(node)
				if reader.pos < len(reader.result.Pattern) && reader.at(")") {
					reader.pos++
				}
				node.End = reader.pos
			case '[':
				node = reader.class(alternative)
			case '\\':
				node = reader.escape(alternative, false)
			case '^', '$':
				reader.pos++
				node = reader.add(alternative, RegExpLintAssertion, start)
			case '.':
				reader.pos++
				node = reader.add(alternative, RegExpLintSet, start)
			default:
				node = reader.character(alternative)
			}
			reader.quantifier(alternative, node)
		}
		alternative.End = reader.pos
		if reader.pos >= len(reader.result.Pattern) || !reader.at("|") {
			break
		}
		reader.pos++
	}
}

func (reader *regExpLintReader) quantifier(parent, element *RegExpLintNode) {
	if reader.pos >= len(reader.result.Pattern) {
		return
	}
	start := reader.pos
	minimum, maximum := 0, -1
	switch reader.result.Pattern[reader.pos] {
	case '*':
		reader.pos++
	case '+':
		minimum = 1
		reader.pos++
	case '?':
		maximum = 1
		reader.pos++
	case '{':
		end := strings.IndexByte(reader.result.Pattern[start:], '}')
		if end < 0 {
			return
		}
		parts := strings.Split(reader.result.Pattern[start+1:start+end], ",")
		var err error
		minimum, err = strconv.Atoi(parts[0])
		if err != nil || len(parts) > 2 {
			return
		}
		maximum = minimum
		if len(parts) == 2 {
			maximum = -1
			if parts[1] != "" {
				maximum, err = strconv.Atoi(parts[1])
				if err != nil {
					return
				}
			}
		}
		reader.pos = start + end + 1
	default:
		return
	}
	if reader.pos < len(reader.result.Pattern) && reader.at("?") {
		reader.pos++
	}
	parent.Children = parent.Children[:len(parent.Children)-1]
	node := reader.add(parent, RegExpLintQuantifier, element.Start)
	node.Min, node.Max, node.Children = minimum, maximum, []*RegExpLintNode{element}
	element.Parent = node
}

func (reader *regExpLintReader) character(parent *RegExpLintNode) *RegExpLintNode {
	start := reader.pos
	value, size := stringutil.DecodeJSStringRune(reader.result.Pattern[start:])
	reader.pos += size
	if value > 0xffff && !reader.unicode {
		high, low := utf16.EncodeRune(value)
		first := reader.add(parent, RegExpLintCharacter, start)
		first.Value = high
		second := reader.add(parent, RegExpLintCharacter, start)
		second.Value = low
		return second
	}
	node := reader.add(parent, RegExpLintCharacter, start)
	node.Value = value
	return node
}

func (reader *regExpLintReader) escape(parent *RegExpLintNode, inClass bool) *RegExpLintNode {
	start := reader.pos
	reader.pos++
	if reader.pos >= len(reader.result.Pattern) {
		return reader.add(parent, RegExpLintCharacter, start)
	}
	escaped := reader.result.Pattern[reader.pos]
	reader.pos++
	node := reader.add(parent, RegExpLintCharacter, start)
	node.Value = rune(escaped)
	switch escaped {
	case 'b':
		if inClass {
			node.Value = 8
		} else {
			node.Kind = RegExpLintAssertion
		}
	case 'B':
		if !inClass {
			node.Kind = RegExpLintAssertion
		}
	case 'd', 'D', 's', 'S', 'w', 'W':
		node.Kind = RegExpLintSet
	case 'p', 'P':
		if reader.unicode && reader.at("{") {
			node.Kind = RegExpLintSet
			for reader.pos < len(reader.result.Pattern) && !reader.at("}") {
				reader.pos++
			}
			if reader.pos < len(reader.result.Pattern) {
				reader.pos++
			}
		}
	case 'q':
		if inClass && reader.sets && reader.at("{") {
			node.Kind = RegExpLintClassStrings
			reader.pos++
			for {
				alternative := reader.add(node, RegExpLintClassString, reader.pos)
				for reader.pos < len(reader.result.Pattern) && !reader.at("|") && !reader.at("}") {
					if reader.at(`\`) {
						reader.escape(alternative, true)
					} else {
						reader.character(alternative)
					}
				}
				alternative.End = reader.pos
				if reader.pos >= len(reader.result.Pattern) || reader.at("}") {
					break
				}
				reader.pos++
			}
			if reader.pos < len(reader.result.Pattern) {
				reader.pos++
			}
		}
	case 'k':
		if !inClass && (reader.unicode || reader.named) && reader.at("<") {
			reader.pos++
			nameStart := reader.pos
			for reader.pos < len(reader.result.Pattern) && !reader.at(">") {
				reader.pos++
			}
			node.Kind, node.Name = RegExpLintBackreference, regExpLintName(reader.result.Pattern[nameStart:reader.pos])
			if reader.pos < len(reader.result.Pattern) {
				reader.pos++
			}
			reader.result.Backreferences = append(reader.result.Backreferences, node)
		}
	case 'f':
		node.Value = 12
	case 'n':
		node.Value = 10
	case 'r':
		node.Value = 13
	case 't':
		node.Value = 9
	case 'v':
		node.Value = 11
	case 'c':
		if reader.pos < len(reader.result.Pattern) {
			control := reader.result.Pattern[reader.pos]
			if isRegExpLintControlLetter(control) || inClass && !reader.unicode && (control == '_' || control >= '0' && control <= '9') {
				node.Value = rune(control & 31)
				reader.pos++
			} else if !inClass {
				node.Value = '\\'
				reader.pos--
			}
		}
	case 'x', 'u':
		count := 2
		if escaped == 'u' {
			count = 4
		}
		end := reader.pos + count
		digits := reader.pos
		braces := escaped == 'u' && reader.unicode && reader.at("{")
		if braces {
			digits++
			end = digits
			for end < len(reader.result.Pattern) && reader.result.Pattern[end] != '}' {
				end++
			}
		}
		if end <= len(reader.result.Pattern) {
			if value, err := strconv.ParseUint(reader.result.Pattern[digits:end], 16, 32); err == nil {
				node.Value, reader.pos = rune(value), end
				if braces && reader.pos < len(reader.result.Pattern) {
					reader.pos++
				}
				if reader.unicode && node.Value >= 0xd800 && node.Value <= 0xdbff && reader.at(`\u`) && reader.pos+6 <= len(reader.result.Pattern) {
					if low, err := strconv.ParseUint(reader.result.Pattern[reader.pos+2:reader.pos+6], 16, 32); err == nil && low >= 0xdc00 && low <= 0xdfff {
						node.Value = utf16.DecodeRune(node.Value, rune(low))
						reader.pos += 6
					}
				}
			}
		}
	default:
		if escaped >= '0' && escaped <= '9' {
			end := reader.pos
			for end < len(reader.result.Pattern) && reader.result.Pattern[end] >= '0' && reader.result.Pattern[end] <= '9' {
				end++
			}
			index, _ := strconv.Atoi(reader.result.Pattern[start+1 : end])
			if !inClass && escaped != '0' && index > 0 && index <= reader.captureCount {
				node.Kind, node.Index, reader.pos = RegExpLintBackreference, index, end
				reader.result.Backreferences = append(reader.result.Backreferences, node)
			} else if escaped <= '7' {
				limit := start + 4
				if escaped > '3' {
					limit--
				}
				for reader.pos < len(reader.result.Pattern) && reader.pos < limit && reader.result.Pattern[reader.pos] >= '0' && reader.result.Pattern[reader.pos] <= '7' {
					reader.pos++
				}
				value, _ := strconv.ParseUint(reader.result.Pattern[start+1:reader.pos], 8, 32)
				node.Value = rune(value)
			}
		}
	}
	node.End = reader.pos
	return node
}

func regExpLintCaptureInfo(pattern string, sets bool) (int, bool) {
	count, depth := 0, 0
	named := false
	for index := 0; index < len(pattern); index++ {
		switch pattern[index] {
		case '\\':
			index++
		case '[':
			if depth == 0 || sets {
				depth++
			}
		case ']':
			if depth > 0 {
				depth--
			}
		case '(':
			if depth == 0 {
				captureName := strings.HasPrefix(pattern[index:], "(?<") && index+3 < len(pattern) && pattern[index+3] != '=' && pattern[index+3] != '!'
				if index+1 == len(pattern) || pattern[index+1] != '?' || captureName {
					count++
				}
				named = named || captureName
			}
		}
	}
	return count, named
}

func regExpLintName(name string) string {
	reader := regExpLintReader{result: &RegExpLint{Pattern: name}, unicode: true}
	parent := &RegExpLintNode{}
	var decoded strings.Builder
	for reader.pos < len(name) {
		var node *RegExpLintNode
		if reader.at(`\`) {
			node = reader.escape(parent, true)
		} else {
			node = reader.character(parent)
		}
		decoded.WriteRune(node.Value)
	}
	return decoded.String()
}

func (reader *regExpLintReader) class(parent *RegExpLintNode) *RegExpLintNode {
	start := reader.pos
	reader.pos++
	node := reader.add(parent, RegExpLintClass, start)
	if reader.at("^") {
		node.Negative = true
		reader.pos++
	}
	for reader.pos < len(reader.result.Pattern) && !reader.at("]") {
		var element *RegExpLintNode
		if reader.sets && (reader.at("&&") || reader.at("--")) {
			kind := RegExpLintIntersection
			if reader.at("--") {
				kind = RegExpLintSubtraction
			}
			operatorStart := reader.pos
			reader.pos += 2
			reader.add(node, kind, operatorStart)
			continue
		}
		if reader.at(`\`) {
			element = reader.escape(node, true)
		} else if reader.sets && reader.at("[") {
			element = reader.class(node)
		} else {
			element = reader.character(node)
		}
		if element.Kind == RegExpLintCharacter && reader.pos+1 < len(reader.result.Pattern) && reader.at("-") && !reader.at("--") && reader.result.Pattern[reader.pos+1] != ']' {
			reader.pos++
			node.Children = node.Children[:len(node.Children)-1]
			rangeNode := reader.add(node, RegExpLintRange, element.Start)
			rangeNode.Children = append(rangeNode.Children, element)
			element.Parent = rangeNode
			if reader.at(`\`) {
				reader.escape(rangeNode, true)
			} else {
				reader.character(rangeNode)
			}
			rangeNode.End = reader.pos
			if len(rangeNode.Children) == 2 && rangeNode.Children[1].Kind != RegExpLintCharacter {
				node.Children = node.Children[:len(node.Children)-1]
				element.Parent = node
				node.Children = append(node.Children, element, &RegExpLintNode{Kind: RegExpLintCharacter, Start: element.End, End: element.End + 1, Value: '-', Parent: node}, rangeNode.Children[1])
				rangeNode.Children[1].Parent = node
			}
		}
	}
	if reader.pos < len(reader.result.Pattern) {
		reader.pos++
	}
	node.End = reader.pos
	if reader.sets {
		for _, child := range node.Children {
			if child.Kind != RegExpLintIntersection && child.Kind != RegExpLintSubtraction {
				continue
			}
			operation := &RegExpLintNode{Kind: child.Kind, Start: node.Start + 1, End: node.End - 1, Parent: node}
			if node.Negative {
				operation.Start++
			}
			for _, operand := range node.Children {
				if operand.Kind != RegExpLintIntersection && operand.Kind != RegExpLintSubtraction {
					operand.Parent = operation
					operation.Children = append(operation.Children, operand)
				}
			}
			node.Children = []*RegExpLintNode{operation}
			break
		}
	}
	return node
}
