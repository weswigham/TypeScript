package regex

import (
	"slices"
	"strconv"
	"strings"
	"unicode"
	"unicode/utf16"
)

type Pattern struct {
	root     *bindingRegexNode
	captures int
	names    map[string]int
	valid    bool
}

type bindingRegexNode struct {
	kind      rune
	children  []*bindingRegexNode
	character rune
	predicate func(rune) bool
	minimum   int
	maximum   int
	capture   int
	name      string
	negative  bool
	lazy      bool
	flags     int
}

type bindingRegexParser struct {
	text     []rune
	position int
	pattern  *Pattern
	flags    int
}

type bindingRegexState struct {
	position int
	captures [][2]int
}

func Compile(text string) *Pattern {
	pattern := &Pattern{valid: true, names: make(map[string]int)}
	parser := &bindingRegexParser{text: []rune(text), pattern: pattern}
	pattern.root = parser.disjunction()
	pattern.valid = pattern.valid && parser.position == len(parser.text)
	return pattern
}

func (parser *bindingRegexParser) take(character rune) bool {
	if parser.position < len(parser.text) && parser.text[parser.position] == character {
		parser.position++
		return true
	}
	return false
}

func (parser *bindingRegexParser) disjunction() *bindingRegexNode {
	var alternatives []*bindingRegexNode
	for {
		var sequence []*bindingRegexNode
		for parser.position < len(parser.text) && parser.text[parser.position] != ')' && parser.text[parser.position] != '|' {
			atom := parser.atom()
			minimum, maximum := -1, -1
			switch {
			case parser.take('*'):
				minimum, maximum = 0, -1
			case parser.take('+'):
				minimum, maximum = 1, -1
			case parser.take('?'):
				minimum, maximum = 0, 1
			case parser.take('{'):
				minimum = parser.decimal()
				maximum = minimum
				if parser.take(',') {
					maximum = -1
					if parser.position < len(parser.text) && parser.text[parser.position] >= '0' && parser.text[parser.position] <= '9' {
						maximum = parser.decimal()
					}
				}
				if minimum < 0 || !parser.take('}') || maximum >= 0 && maximum < minimum {
					parser.pattern.valid = false
				}
			}
			if minimum >= 0 {
				atom = &bindingRegexNode{kind: '*', children: []*bindingRegexNode{atom}, minimum: minimum, maximum: maximum, lazy: parser.take('?')}
			}
			sequence = append(sequence, atom)
		}
		alternatives = append(alternatives, &bindingRegexNode{kind: '.', children: sequence})
		if !parser.take('|') {
			break
		}
	}
	return &bindingRegexNode{kind: '|', children: alternatives}
}

func (parser *bindingRegexParser) decimal() int {
	start := parser.position
	for parser.position < len(parser.text) && parser.text[parser.position] >= '0' && parser.text[parser.position] <= '9' {
		parser.position++
	}
	value, err := strconv.Atoi(string(parser.text[start:parser.position]))
	if err != nil {
		parser.pattern.valid = false
		return -1
	}
	return value
}

func (parser *bindingRegexParser) atom() *bindingRegexNode {
	character := parser.text[parser.position]
	parser.position++
	node := &bindingRegexNode{kind: 'c', character: character, flags: parser.flags}
	switch character {
	case '^', '$':
		node.kind = character
	case '.':
		node.kind = 'a'
	case '\\':
		return parser.escape(false)
	case '[':
		node.kind = 'p'
		negative := parser.take('^')
		var predicates []func(rune) bool
		for parser.position < len(parser.text) && parser.text[parser.position] != ']' {
			first := parser.classAtom()
			if parser.position+1 < len(parser.text) && parser.text[parser.position] == '-' && parser.text[parser.position+1] != ']' {
				parser.position++
				last := parser.classAtom()
				if first.kind != 'c' || last.kind != 'c' || first.character > last.character {
					parser.pattern.valid = false
				}
				predicates = append(predicates, func(value rune) bool { return first.character <= value && value <= last.character })
			} else if first.kind == 'c' {
				predicates = append(predicates, func(value rune) bool { return value == first.character })
			} else {
				predicates = append(predicates, first.predicate)
			}
		}
		if !parser.take(']') {
			parser.pattern.valid = false
		}
		node.predicate = func(value rune) bool {
			matched := false
			for _, predicate := range predicates {
				if predicate != nil && predicate(value) {
					matched = true
					break
				}
			}
			return matched != negative
		}
	case '(':
		node.kind = 'g'
		oldFlags := parser.flags
		if parser.take('?') {
			switch {
			case parser.take(':'):
				node.kind = '.'
			case parser.take('='):
				node.kind = '='
			case parser.take('!'):
				node.kind, node.negative = '=', true
			case parser.take('<'):
				if parser.take('=') {
					node.kind = '<'
				} else if parser.take('!') {
					node.kind, node.negative = '<', true
				} else {
					start := parser.position
					for parser.position < len(parser.text) && parser.text[parser.position] != '>' {
						parser.position++
					}
					node.name = string(parser.text[start:parser.position])
					if !parser.take('>') {
						parser.pattern.valid = false
					}
				}
			default:
				node.kind = '.'
				remove := false
				for parser.position < len(parser.text) && parser.text[parser.position] != ':' {
					flag := parser.text[parser.position]
					parser.position++
					if flag == '-' {
						remove = true
						continue
					}
					bit := 0
					switch flag {
					case 'i':
						bit = 1
					case 'm':
						bit = 2
					case 's':
						bit = 4
					default:
						parser.pattern.valid = false
					}
					if remove {
						parser.flags &^= bit
					} else {
						parser.flags |= bit
					}
				}
				if !parser.take(':') {
					parser.pattern.valid = false
				}
			}
		}
		if node.kind == 'g' {
			parser.pattern.captures++
			node.capture = parser.pattern.captures
			if node.name != "" {
				parser.pattern.names[node.name] = node.capture
			}
		}
		node.children = []*bindingRegexNode{parser.disjunction()}
		parser.flags = oldFlags
		if !parser.take(')') {
			parser.pattern.valid = false
		}
	}
	return node
}

func (parser *bindingRegexParser) classAtom() *bindingRegexNode {
	if parser.take('\\') {
		return parser.escape(true)
	}
	character := parser.text[parser.position]
	parser.position++
	return &bindingRegexNode{kind: 'c', character: character}
}

func (parser *bindingRegexParser) hex(count int) rune {
	start := parser.position
	if start+count > len(parser.text) {
		parser.pattern.valid = false
		parser.position = len(parser.text)
		return 0
	}
	parser.position += count
	value, err := strconv.ParseUint(string(parser.text[start:parser.position]), 16, 32)
	if err != nil || value > unicode.MaxRune {
		parser.pattern.valid = false
	}
	return rune(value)
}

func (parser *bindingRegexParser) escape(inClass bool) *bindingRegexNode {
	node := &bindingRegexNode{kind: 'c', flags: parser.flags}
	if parser.position == len(parser.text) {
		parser.pattern.valid = false
		return node
	}
	character := parser.text[parser.position]
	parser.position++
	node.character = character
	switch character {
	case 'b', 'B':
		if !inClass {
			node.kind, node.negative = 'b', character == 'B'
		} else {
			node.character = '\b'
		}
	case 'd', 'D', 'w', 'W', 's', 'S':
		node.kind = 'p'
		node.predicate = func(value rune) bool {
			matched := false
			switch unicode.ToLower(character) {
			case 'd':
				matched = value >= '0' && value <= '9'
			case 'w':
				matched = bindingWord(value)
			case 's':
				matched = bindingSpace(value)
			}
			return matched != unicode.IsUpper(character)
		}
	case 'n':
		node.character = '\n'
	case 'r':
		node.character = '\r'
	case 't':
		node.character = '\t'
	case 'v':
		node.character = '\v'
	case 'f':
		node.character = '\f'
	case '0':
		node.character = 0
	case 'c':
		if parser.position < len(parser.text) {
			node.character = unicode.ToUpper(parser.text[parser.position]) % 32
			parser.position++
		} else {
			parser.pattern.valid = false
		}
	case 'x':
		node.character = parser.hex(2)
	case 'u':
		if parser.take('{') {
			start := parser.position
			for parser.position < len(parser.text) && parser.text[parser.position] != '}' {
				parser.position++
			}
			count := parser.position - start
			parser.position = start
			node.character = parser.hex(count)
			if !parser.take('}') {
				parser.pattern.valid = false
			}
		} else {
			node.character = parser.hex(4)
			if node.character >= 0xd800 && node.character <= 0xdbff && parser.position+6 <= len(parser.text) && string(parser.text[parser.position:parser.position+2]) == `\u` {
				parser.position += 2
				second := parser.hex(4)
				if second >= 0xdc00 && second <= 0xdfff {
					node.character = utf16.DecodeRune(node.character, second)
				} else {
					parser.position -= 6
				}
			}
		}
	case 'p', 'P':
		node.kind = 'p'
		if !parser.take('{') {
			parser.pattern.valid = false
			return node
		}
		start := parser.position
		for parser.position < len(parser.text) && parser.text[parser.position] != '}' {
			parser.position++
		}
		property := bindingUnicodeProperty(string(parser.text[start:parser.position]))
		if !parser.take('}') || property == nil {
			parser.pattern.valid = false
		}
		node.predicate = func(value rune) bool { return property != nil && property(value) != (character == 'P') }
	case 'k':
		node.kind = 'r'
		if !parser.take('<') {
			parser.pattern.valid = false
			return node
		}
		start := parser.position
		for parser.position < len(parser.text) && parser.text[parser.position] != '>' {
			parser.position++
		}
		node.name = string(parser.text[start:parser.position])
		if !parser.take('>') {
			parser.pattern.valid = false
		}
	default:
		if character >= '1' && character <= '9' {
			parser.position--
			node.kind, node.capture = 'r', parser.decimal()
		}
	}
	return node
}

func (pattern *Pattern) IsValid() bool {
	return pattern.valid
}

func (pattern *Pattern) MatchString(value string) bool {
	if !pattern.valid {
		return false
	}
	text := []rune(value)
	for position := 0; position <= len(text); position++ {
		captures := make([][2]int, pattern.captures+1)
		for index := range captures {
			captures[index] = [2]int{-1, -1}
		}
		if len(pattern.match(pattern.root, text, bindingRegexState{position, captures}, 1)) > 0 {
			return true
		}
	}
	return false
}

func (pattern *Pattern) match(node *bindingRegexNode, text []rune, state bindingRegexState, direction int) []bindingRegexState {
	position := state.position
	characterIndex := position
	if direction < 0 {
		characterIndex--
	}
	within := characterIndex >= 0 && characterIndex < len(text)
	switch node.kind {
	case 'c', 'p', 'a':
		if !within {
			return nil
		}
		character := text[characterIndex]
		matched := node.kind == 'c' && character == node.character || node.kind == 'p' && node.predicate != nil && node.predicate(character) || node.kind == 'a' && (node.flags&4 != 0 || character != '\r' && character != '\n' && character != '\u2028' && character != '\u2029')
		if !matched && node.flags&1 != 0 {
			if node.kind == 'c' {
				matched = unicode.ToLower(character) == unicode.ToLower(node.character)
			} else if node.kind == 'p' && node.predicate != nil {
				for folded := unicode.SimpleFold(character); folded != character; folded = unicode.SimpleFold(folded) {
					if node.predicate(folded) {
						matched = true
						break
					}
				}
			}
		}
		if !matched {
			return nil
		}
		state.position += direction
		return []bindingRegexState{state}
	case '^':
		if position == 0 || node.flags&2 != 0 && strings.ContainsRune("\r\n\u2028\u2029", text[position-1]) {
			return []bindingRegexState{state}
		}
		return nil
	case '$':
		if position == len(text) || node.flags&2 != 0 && strings.ContainsRune("\r\n\u2028\u2029", text[position]) {
			return []bindingRegexState{state}
		}
		return nil
	case 'b':
		before := position > 0 && bindingWord(text[position-1])
		after := position < len(text) && bindingWord(text[position])
		if (before != after) != node.negative {
			return []bindingRegexState{state}
		}
		return nil
	case '|':
		var results []bindingRegexState
		for _, child := range node.children {
			results = append(results, pattern.match(child, text, state, direction)...)
		}
		return results
	case '.':
		states := []bindingRegexState{state}
		for offset := range node.children {
			index := offset
			if direction < 0 {
				index = len(node.children) - 1 - offset
			}
			var next []bindingRegexState
			for _, candidate := range states {
				next = append(next, pattern.match(node.children[index], text, candidate, direction)...)
			}
			states = next
			if len(states) == 0 {
				break
			}
		}
		return states
	case 'g':
		results := pattern.match(node.children[0], text, state, direction)
		for index := range results {
			results[index].captures = slices.Clone(results[index].captures)
			results[index].captures[node.capture] = [2]int{min(position, results[index].position), max(position, results[index].position)}
		}
		return results
	case 'r':
		capture := node.capture
		if node.name != "" {
			capture = pattern.names[node.name]
		}
		if capture >= len(state.captures) {
			return nil
		}
		rangeValue := state.captures[capture]
		if rangeValue[0] < 0 {
			return []bindingRegexState{state}
		}
		length := rangeValue[1] - rangeValue[0]
		start := position
		if direction < 0 {
			start -= length
		}
		if start < 0 || start+length > len(text) {
			return nil
		}
		for offset := range length {
			left, right := text[start+offset], text[rangeValue[0]+offset]
			if left != right && (node.flags&1 == 0 || unicode.ToLower(left) != unicode.ToLower(right)) {
				return nil
			}
		}
		state.position += direction * length
		return []bindingRegexState{state}
	case '=', '<':
		lookDirection := 1
		if node.kind == '<' {
			lookDirection = -1
		}
		results := pattern.match(node.children[0], text, state, lookDirection)
		if node.negative {
			if len(results) == 0 {
				return []bindingRegexState{state}
			}
			return nil
		}
		if len(results) == 0 {
			return nil
		}
		results[0].position = position
		return results[:1]
	case '*':
		var results []bindingRegexState
		var repeat func(bindingRegexState, int)
		repeat = func(candidate bindingRegexState, count int) {
			if node.lazy && count >= node.minimum {
				results = append(results, candidate)
			}
			if node.maximum < 0 || count < node.maximum {
				cleared := candidate
				cleared.captures = slices.Clone(candidate.captures)
				var reset func(*bindingRegexNode)
				reset = func(child *bindingRegexNode) {
					if child.kind == 'g' {
						cleared.captures[child.capture] = [2]int{-1, -1}
					}
					for _, descendant := range child.children {
						reset(descendant)
					}
				}
				reset(node.children[0])
				for _, next := range pattern.match(node.children[0], text, cleared, direction) {
					if next.position != candidate.position || count < node.minimum {
						repeat(next, count+1)
					}
				}
			}
			if !node.lazy && count >= node.minimum {
				results = append(results, candidate)
			}
		}
		repeat(state, 0)
		return results
	}
	return nil
}
