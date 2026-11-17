package selectors

import (
	"fmt"
	"regexp"
	"slices"
	"strconv"
	"strings"
	"unicode"
)

type Node struct {
	Type       string
	Parent     *Node
	Children   []*Node
	Field      string
	Index      int
	List       bool
	Attributes map[string]any
	Native     any
}

func (node *Node) Value(path string) (any, bool) {
	if path == "type" {
		return node.Type, true
	}
	if value, ok := node.Attributes[path]; ok {
		return value, true
	}
	field, rest, nested := strings.Cut(path, ".")
	var children []*Node
	for _, child := range node.Children {
		if child.Field == field {
			children = append(children, child)
		}
	}
	if nested && rest == "length" {
		if value, ok := node.Attributes[field+".length"]; ok {
			return value, true
		}
		if len(children) != 0 && children[0].List {
			return float64(len(children)), true
		}
	}
	for _, child := range children {
		if !nested {
			return child, true
		}
		if child.List {
			index, tail, hasTail := strings.Cut(rest, ".")
			if index == strconv.Itoa(child.Index) {
				if hasTail {
					return child.Value(tail)
				}
				return child, true
			}
		} else {
			return child.Value(rest)
		}
	}
	return nil, false
}

type RegexCompiler func(pattern, flags string) (func(string) bool, error)

type (
	Selector   struct{ root *expression }
	expression struct {
		kind     string
		value    string
		operator string
		number   int
		literal  any
		regex    func(string) bool
		children []*expression
		subject  bool
		cache    map[*Node]result
	}
)

type parser struct {
	text     string
	position int
	regex    RegexCompiler
}

func Parse(text string) (*Selector, error) {
	return ParseWithRegex(text, func(pattern, flags string) (func(string) bool, error) {
		if flags != "" {
			pattern = "(?" + flags + ")" + pattern
		}
		compiled, err := regexp.Compile(pattern)
		if err != nil {
			return nil, err
		}
		return compiled.MatchString, nil
	})
}

func ParseWithRegex(text string, regex RegexCompiler) (*Selector, error) {
	parser := &parser{text: text, regex: regex}
	root, err := parser.list()
	parser.space()
	if err == nil && parser.position != len(text) {
		err = parser.error("unexpected token")
	}
	if err != nil {
		return nil, err
	}
	return &Selector{root: root}, nil
}

func (parser *parser) error(message string) error {
	return fmt.Errorf("selector at %d: %s", parser.position, message)
}

func (parser *parser) take(text string) bool {
	if strings.HasPrefix(parser.text[parser.position:], text) {
		parser.position += len(text)
		return true
	}
	return false
}

func (parser *parser) space() bool {
	start := parser.position
	for parser.position < len(parser.text) && strings.ContainsRune(" \t\r\n\f", rune(parser.text[parser.position])) {
		parser.position++
	}
	return start != parser.position
}

func (parser *parser) identifier() string {
	start := parser.position
	for parser.position < len(parser.text) {
		character := parser.text[parser.position]
		if strings.ContainsRune(" [](),:!><=~+.#/\t\r\n", rune(character)) {
			break
		}
		parser.position++
	}
	return parser.text[start:parser.position]
}

func (parser *parser) list() (*expression, error) {
	var choices []*expression
	for {
		parser.space()
		item, err := parser.chain()
		if err != nil {
			return nil, err
		}
		choices = append(choices, item)
		parser.space()
		if !parser.take(",") {
			break
		}
	}
	if len(choices) == 1 {
		return choices[0], nil
	}
	return &expression{kind: "matches", children: choices}, nil
}

func (parser *parser) chain() (*expression, error) {
	left, err := parser.compound()
	if err != nil {
		return nil, err
	}
	for {
		space := parser.space()
		kind := ""
		for _, operator := range []string{">", "+", "~"} {
			if parser.take(operator) {
				kind = operator
				break
			}
		}
		if kind == "" {
			if !space || parser.position == len(parser.text) || strings.ContainsRune(",)", rune(parser.text[parser.position])) {
				break
			}
			kind = " "
		}
		parser.space()
		right, err := parser.compound()
		if err != nil {
			return nil, err
		}
		left = &expression{kind: kind, children: []*expression{left, right}}
	}
	return left, nil
}

func (parser *parser) compound() (*expression, error) {
	subject := parser.take("!")
	var terms []*expression
	if parser.take("*") {
		terms = append(terms, &expression{kind: "wildcard"})
	} else {
		parser.take("#")
		if name := parser.identifier(); name != "" {
			terms = append(terms, &expression{kind: "type", value: name})
		}
	}
	for parser.position < len(parser.text) {
		var term *expression
		var err error
		switch {
		case parser.take("."):
			start := parser.position
			for {
				if parser.identifier() == "" {
					return nil, parser.error("expected field")
				}
				if !parser.take(".") {
					break
				}
			}
			term = &expression{kind: "field", value: parser.text[start:parser.position]}
		case parser.take("["):
			term, err = parser.attribute()
		case parser.take(":"):
			term, err = parser.pseudo()
		default:
			if len(terms) == 0 {
				return nil, parser.error("expected selector")
			}
			return &expression{kind: "compound", children: terms, subject: subject}, nil
		}
		if err != nil {
			return nil, err
		}
		terms = append(terms, term)
	}
	if len(terms) == 0 {
		return nil, parser.error("expected selector")
	}
	return &expression{kind: "compound", children: terms, subject: subject}, nil
}

func (parser *parser) quoted() (string, error) {
	quote := parser.text[parser.position]
	parser.position++
	var value strings.Builder
	for parser.position < len(parser.text) {
		character := parser.text[parser.position]
		parser.position++
		if character == quote {
			return value.String(), nil
		}
		if character == '\\' {
			if parser.position == len(parser.text) {
				break
			}
			character = parser.text[parser.position]
			parser.position++
			switch character {
			case 'n':
				character = '\n'
			case 'r':
				character = '\r'
			case 't':
				character = '\t'
			case 'b':
				character = '\b'
			case 'f':
				character = '\f'
			case 'v':
				character = '\v'
			}
		}
		value.WriteByte(character)
	}
	return "", parser.error("unterminated string")
}

func (parser *parser) attribute() (*expression, error) {
	parser.space()
	start := parser.position
	for parser.position < len(parser.text) && !strings.ContainsRune(" ]\t\r\n!=<>", rune(parser.text[parser.position])) {
		parser.position++
	}
	if start == parser.position {
		return nil, parser.error("expected attribute name")
	}
	term := &expression{kind: "attribute", value: parser.text[start:parser.position]}
	parser.space()
	if parser.take("]") {
		return term, nil
	}
	for _, operator := range []string{"!=", "<=", ">=", "=", "<", ">"} {
		if parser.take(operator) {
			term.operator = operator
			break
		}
	}
	if term.operator == "" {
		return nil, parser.error("expected attribute operator")
	}
	parser.space()
	switch {
	case parser.position == len(parser.text):
		return nil, parser.error("expected attribute value")
	case parser.text[parser.position] == '\'' || parser.text[parser.position] == '"':
		value, err := parser.quoted()
		if err != nil {
			return nil, err
		}
		term.literal = value
	case parser.take("type("):
		term.kind = "attribute-type"
		term.literal = parser.identifier()
		if !parser.take(")") {
			return nil, parser.error("expected type closing parenthesis")
		}
	case parser.take("/"):
		start := parser.position
		escaped, inClass := false, false
		for parser.position < len(parser.text) {
			character := parser.text[parser.position]
			if !escaped && character == '/' && !inClass {
				break
			}
			if !escaped && character == '[' {
				inClass = true
			}
			if !escaped && character == ']' {
				inClass = false
			}
			if character == '\\' && !escaped {
				escaped = true
			} else {
				escaped = false
			}
			parser.position++
		}
		pattern := parser.text[start:parser.position]
		if !parser.take("/") {
			return nil, parser.error("unterminated regex")
		}
		start = parser.position
		for parser.position < len(parser.text) && strings.ContainsRune("imsu", rune(parser.text[parser.position])) {
			parser.position++
		}
		compiled, err := parser.regex(pattern, parser.text[start:parser.position])
		if err != nil {
			return nil, err
		}
		term.kind, term.regex = "attribute-regex", compiled
	default:
		start := parser.position
		for parser.position < len(parser.text) && parser.text[parser.position] != ']' && !unicode.IsSpace(rune(parser.text[parser.position])) {
			parser.position++
		}
		value := parser.text[start:parser.position]
		if number, err := strconv.ParseFloat(value, 64); err == nil {
			term.literal = number
		} else {
			term.literal = value
		}
	}
	parser.space()
	if !parser.take("]") {
		return nil, parser.error("expected closing bracket")
	}
	return term, nil
}

func (parser *parser) pseudo() (*expression, error) {
	name := parser.identifier()
	term := &expression{kind: name}
	switch name {
	case "not", "matches", "has", "is":
		if name == "is" {
			term.kind = "matches"
		}
		if !parser.take("(") {
			return nil, parser.error("expected pseudo argument")
		}
		inner, err := parser.list()
		if err != nil {
			return nil, err
		}
		if !parser.take(")") {
			return nil, parser.error("expected closing parenthesis")
		}
		term.children = []*expression{inner}
	case "first-child", "last-child":
		return term, nil
	case "nth-child", "nth-last-child":
		if !parser.take("(") {
			return nil, parser.error("expected child index")
		}
		parser.space()
		start := parser.position
		for parser.position < len(parser.text) && parser.text[parser.position] >= '0' && parser.text[parser.position] <= '9' {
			parser.position++
		}
		index, err := strconv.Atoi(parser.text[start:parser.position])
		if err != nil {
			return nil, parser.error("expected integer index")
		}
		term.number = index
		parser.space()
		if !parser.take(")") {
			return nil, parser.error("expected closing parenthesis")
		}
	case "statement", "expression", "declaration", "function", "pattern":
		term.kind, term.value = "class", name
	default:
		return nil, parser.error("unknown pseudo-class " + name)
	}
	return term, nil
}

type result struct {
	ok       bool
	subjects []*Node
}

func yes(ok bool) result                         { return result{ok: ok} }
func (selector *Selector) Match(node *Node) bool { return selector.root.match(node).ok }
func (selector *Selector) Selected(node *Node) []*Node {
	matched := selector.root.match(node)
	if !matched.ok {
		return nil
	}
	if len(matched.subjects) == 0 {
		return []*Node{node}
	}
	return matched.subjects
}

func (term *expression) match(node *Node) result {
	if node == nil {
		return result{}
	}
	if cached, ok := term.cache[node]; ok {
		return cached
	}
	matched := term.compute(node)
	if term.cache == nil {
		term.cache = make(map[*Node]result)
	}
	term.cache[node] = matched
	return matched
}

func (term *expression) compute(node *Node) result {
	var matched result
	switch term.kind {
	case "wildcard":
		matched = yes(true)
	case "type":
		matched = yes(strings.EqualFold(node.Type, term.value))
	case "compound":
		matched.ok = true
		for _, child := range term.children {
			item := child.match(node)
			if !item.ok {
				return result{}
			}
			matched.subjects = append(matched.subjects, item.subjects...)
		}
	case "matches":
		for _, child := range term.children {
			item := child.match(node)
			if item.ok {
				matched.ok = true
				matched.subjects = append(matched.subjects, item.subjects...)
			}
		}
	case "not":
		matched = yes(!term.children[0].match(node).ok)
	case "has":
		for _, child := range node.Children {
			for _, item := range []result{term.children[0].match(child), term.match(child)} {
				if item.ok {
					matched.ok = true
					matched.subjects = append(matched.subjects, item.subjects...)
				}
			}
		}
	case ">", " ", "+", "~":
		right := term.children[1].match(node)
		if !right.ok {
			return result{}
		}
		var candidates []*Node
		switch term.kind {
		case ">":
			candidates = append(candidates, node.Parent)
		case " ":
			for parent := node.Parent; parent != nil; parent = parent.Parent {
				candidates = append(candidates, parent)
			}
		default:
			if node.Parent != nil && node.List {
				for _, sibling := range node.Parent.Children {
					if sibling.Field == node.Field && sibling.List && sibling.Index < node.Index && (term.kind == "~" || sibling.Index == node.Index-1) {
						candidates = append(candidates, sibling)
					}
				}
			}
		}
		for _, candidate := range candidates {
			left := term.children[0].match(candidate)
			if left.ok {
				matched.ok = true
				matched.subjects = append(matched.subjects, left.subjects...)
				matched.subjects = append(matched.subjects, right.subjects...)
			}
		}
	case "field":
		fields := strings.Split(term.value, ".")
		current := node
		matched.ok = true
		for _, field := range slices.Backward(fields) {
			if current == nil || current.Field != field {
				matched.ok = false
				break
			}
			current = current.Parent
		}
	case "attribute", "attribute-type", "attribute-regex":
		value, exists := node.Value(term.value)
		if term.operator == "" {
			matched = yes(exists && value != nil)
			break
		}
		equal := false
		if term.kind == "attribute-type" {
			kind := "undefined"
			if exists {
				switch value.(type) {
				case string:
					kind = "string"
				case bool:
					kind = "boolean"
				case float64, int:
					kind = "number"
				default:
					kind = "object"
				}
			}
			equal = kind == term.literal
		} else if term.kind == "attribute-regex" {
			text, ok := value.(string)
			equal = ok && term.regex(text)
		} else {
			equal = exists && stringify(value) == stringify(term.literal)
		}
		switch term.operator {
		case "=":
			matched = yes(equal)
		case "!=":
			matched = yes(!equal)
		default:
			if exists {
				left, leftErr := strconv.ParseFloat(stringify(value), 64)
				right, rightErr := strconv.ParseFloat(stringify(term.literal), 64)
				if leftErr == nil && rightErr == nil {
					switch term.operator {
					case "<":
						matched = yes(left < right)
					case "<=":
						matched = yes(left <= right)
					case ">":
						matched = yes(left > right)
					case ">=":
						matched = yes(left >= right)
					}
				} else if leftText, ok := value.(string); ok {
					if rightText, ok := term.literal.(string); ok {
						switch term.operator {
						case "<":
							matched = yes(leftText < rightText)
						case "<=":
							matched = yes(leftText <= rightText)
						case ">":
							matched = yes(leftText > rightText)
						case ">=":
							matched = yes(leftText >= rightText)
						}
					}
				}
			}
		}
	case "first-child", "last-child", "nth-child", "nth-last-child":
		if node.Parent != nil && node.List {
			length := 0
			for _, sibling := range node.Parent.Children {
				if sibling.Field == node.Field && sibling.List {
					length = max(length, sibling.Index+1)
				}
			}
			index := term.number
			if term.kind == "first-child" || term.kind == "last-child" {
				index = 1
			}
			if term.kind == "last-child" || term.kind == "nth-last-child" {
				matched = yes(length-node.Index == index)
			} else {
				matched = yes(node.Index+1 == index)
			}
		}
	case "class":
		declaration := strings.HasSuffix(node.Type, "Declaration")
		function := node.Type == "FunctionDeclaration" || node.Type == "FunctionExpression" || node.Type == "ArrowFunctionExpression"
		expression := strings.HasSuffix(node.Type, "Expression") || node.Type == "Identifier" || node.Type == "Literal" || node.Type == "MetaProperty"
		switch term.value {
		case "statement":
			matched = yes(strings.HasSuffix(node.Type, "Statement") || declaration)
		case "declaration":
			matched = yes(declaration)
		case "expression":
			matched = yes(expression)
		case "function":
			matched = yes(function)
		case "pattern":
			matched = yes(expression || strings.HasSuffix(node.Type, "Pattern"))
		}
	}
	if matched.ok && term.subject {
		matched.subjects = append(matched.subjects, node)
	}
	return matched
}

func stringify(value any) string {
	if value == nil {
		return "null"
	}
	return fmt.Sprint(value)
}
