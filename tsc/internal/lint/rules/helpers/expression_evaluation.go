package helpers

import (
	"fmt"
	"math"
	"math/big"
	"slices"
	"strconv"
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/checker"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
	"github.com/microsoft/TypeScript/tsc/internal/stringutil"
)

func SemanticExpressionOption(context Context, index int) map[string]any {
	if index < len(context.Options) {
		options, _ := context.Options[index].(map[string]any)
		return options
	}
	return nil
}

func semanticExpressionRegexpConstructor(context Context, node *ast.Node, depth int) bool {
	if node == nil || depth > 30 {
		return false
	}
	node = ast.SkipParentheses(node)
	if SemanticExpressionGlobal(context, node, "RegExp") {
		return true
	}
	if node.Kind == ast.KindPropertyAccessExpression || node.Kind == ast.KindElementAccessExpression {
		object, _, name, _ := SemanticExpressionMember(context, node)
		return name == "RegExp" && (SemanticExpressionGlobal(context, object, "globalThis") || SemanticExpressionGlobal(context, object, "window") || SemanticExpressionGlobal(context, object, "self"))
	}
	if node.Kind == ast.KindIdentifier {
		if symbol := context.GetChecker().GetSymbolAtLocation(node); symbol != nil {
			for _, declaration := range symbol.Declarations() {
				if declaration.Kind == ast.KindVariableDeclaration && declaration.Initializer() != nil && semanticExpressionImmutable(context, declaration, symbol) {
					return semanticExpressionRegexpConstructor(context, declaration.Initializer(), depth+1)
				}
			}
		}
	}
	return false
}

type SemanticExpressionUndefined struct{}

type SemanticExpressionRegex struct{ pattern, Flags string }

type SemanticExpressionEdit struct {
	Start, End int
	Text       string
}

func SemanticExpressionStart(context Context, node *ast.Node) int {
	return scanner.GetTokenPosOfNode(node, context.File, false)
}

func SemanticExpressionText(context Context, node *ast.Node) string {
	return context.File.Text()[SemanticExpressionStart(context, node):node.End()]
}

func SemanticExpressionConstrained(context Context, node *ast.Node) *checker.Type {
	typeChecker := context.GetChecker()
	value := typeChecker.GetTypeAtLocation(node)
	if constraint := typeChecker.GetBaseConstraintOfType(value); constraint != nil {
		return constraint
	}
	return value
}

func SemanticExpressionParts(value *checker.Type) []*checker.Type {
	if value.IsUnion() {
		return value.Types()
	}
	return []*checker.Type{value}
}

func SemanticExpressionNodeIsString(context Context, node *ast.Node) bool {
	return semanticExpressionStringType(SemanticExpressionConstrained(context, node))
}

func semanticExpressionStringType(value *checker.Type) bool {
	if value.IsUnion() {
		for _, part := range value.Types() {
			if !semanticExpressionStringType(part) {
				return false
			}
		}
		return true
	}
	if value.IsIntersection() {
		return slices.ContainsFunc(value.Types(), semanticExpressionStringType)
	}
	return value.Flags()&checker.TypeFlagsStringLike != 0
}

func SemanticExpressionGlobal(context Context, node *ast.Node, name string) bool {
	if node == nil || node.Kind != ast.KindIdentifier || node.Text() != name {
		return false
	}
	symbol := context.GetChecker().GetSymbolAtLocation(node)
	return symbol == nil || context.GetChecker().IsLibSymbolForHoverVerbosity(symbol)
}

func SemanticExpressionMember(context Context, node *ast.Node) (object, property *ast.Node, name string, optional bool) {
	if node == nil {
		return
	}
	node = ast.SkipParentheses(node)
	switch node.Kind {
	case ast.KindPropertyAccessExpression:
		object, property = node.Expression(), node.Name()
		name = property.Text()
		optional = node.AsPropertyAccessExpression().QuestionDotToken != nil
	case ast.KindElementAccessExpression:
		object, property = node.Expression(), node.AsElementAccessExpression().ArgumentExpression
		if value, known := SemanticExpressionStatic(context, property, 0); known {
			name, _ = value.(string)
		}
		optional = node.AsElementAccessExpression().QuestionDotToken != nil
	}
	return
}

func SemanticExpressionString(value any) string {
	switch value := value.(type) {
	case nil:
		return "null"
	case SemanticExpressionUndefined:
		return "undefined"
	case string:
		return value
	case *big.Int:
		return value.String()
	case SemanticExpressionRegex:
		return RenderRegExpLiteral(value.pattern, value.Flags)
	case map[string]any:
		return "[object Object]"
	case float64:
		if value == 0 {
			return "0"
		}
		if math.IsNaN(value) {
			return "NaN"
		}
		if math.IsInf(value, 1) {
			return "Infinity"
		}
		if math.IsInf(value, -1) {
			return "-Infinity"
		}
		return strconv.FormatFloat(value, 'f', -1, 64)
	case []any:
		parts := make([]string, len(value))
		for index, part := range value {
			if part != nil {
				if _, absent := part.(SemanticExpressionUndefined); !absent {
					parts[index] = SemanticExpressionString(part)
				}
			}
		}
		return strings.Join(parts, ",")
	default:
		return fmt.Sprint(value)
	}
}

func SemanticExpressionNumber(value any) float64 {
	switch value := value.(type) {
	case nil:
		return 0
	case float64:
		return value
	case *big.Int:
		number, _ := new(big.Float).SetInt(value).Float64()
		return number
	case bool:
		if value {
			return 1
		}
		return 0
	case SemanticExpressionUndefined:
		return math.NaN()
	default:
		text := strings.TrimSpace(SemanticExpressionString(value))
		if text == "" {
			return 0
		}
		if number, err := strconv.ParseFloat(text, 64); err == nil {
			if !math.IsInf(number, 0) || text == "Infinity" || text == "+Infinity" || text == "-Infinity" {
				return number
			}
		}
		if number, err := strconv.ParseUint(text, 0, 64); err == nil {
			return float64(number)
		}
		return math.NaN()
	}
}

func SemanticExpressionNodeIsNumber(context Context, node *ast.Node, expected float64) bool {
	value, known := SemanticExpressionStatic(context, node, 0)
	number, numeric := value.(float64)
	return known && numeric && number == expected
}

func SemanticExpressionStatic(context Context, node *ast.Node, depth int) (any, bool) {
	if node == nil || depth > 30 {
		return nil, false
	}
	node = ast.SkipParentheses(node)
	switch node.Kind {
	case ast.KindBigIntLiteral:
		value, known := new(big.Int).SetString(strings.TrimSuffix(strings.ReplaceAll(node.Text(), "_", ""), "n"), 0)
		return value, known
	case ast.KindStringLiteral, ast.KindNoSubstitutionTemplateLiteral:
		return node.Text(), true
	case ast.KindNumericLiteral:
		text := strings.ReplaceAll(node.Text(), "_", "")
		if number, err := strconv.ParseFloat(text, 64); err == nil {
			return number, true
		}
		if number, err := strconv.ParseUint(text, 0, 64); err == nil {
			return float64(number), true
		}
	case ast.KindTrueKeyword:
		return true, true
	case ast.KindFalseKeyword:
		return false, true
	case ast.KindNullKeyword:
		return nil, true
	case ast.KindRegularExpressionLiteral:
		text := SemanticExpressionText(context, node)
		last := strings.LastIndexByte(text, '/')
		if last > 0 {
			return SemanticExpressionRegex{text[1:last], text[last+1:]}, true
		}
	case ast.KindIdentifier:
		if SemanticExpressionGlobal(context, node, "undefined") {
			return SemanticExpressionUndefined{}, true
		}
		if SemanticExpressionGlobal(context, node, "NaN") {
			return math.NaN(), true
		}
		if SemanticExpressionGlobal(context, node, "Infinity") {
			return math.Inf(1), true
		}
		if symbol := context.GetChecker().GetSymbolAtLocation(node); symbol != nil {
			for _, declaration := range symbol.Declarations() {
				if declaration.Kind == ast.KindVariableDeclaration && declaration.Initializer() != nil && semanticExpressionImmutable(context, declaration, symbol) {
					return SemanticExpressionStatic(context, declaration.Initializer(), depth+1)
				}
			}
		}
	case ast.KindPrefixUnaryExpression:
		expression := node.AsPrefixUnaryExpression()
		value, known := SemanticExpressionStatic(context, expression.Operand, depth+1)
		if !known {
			return nil, false
		}
		if integer, ok := value.(*big.Int); ok {
			switch expression.Operator {
			case ast.KindMinusToken:
				return new(big.Int).Neg(integer), true
			case ast.KindTildeToken:
				return new(big.Int).Not(integer), true
			case ast.KindExclamationToken:
				return integer.Sign() == 0, true
			default:
				return nil, false
			}
		}
		switch expression.Operator {
		case ast.KindMinusToken:
			return -SemanticExpressionNumber(value), true
		case ast.KindPlusToken:
			return SemanticExpressionNumber(value), true
		case ast.KindTildeToken:
			return float64(^int32(int64(SemanticExpressionNumber(value)))), true
		case ast.KindExclamationToken:
			return !semanticExpressionTruthy(value), true
		}
	case ast.KindVoidExpression:
		return SemanticExpressionUndefined{}, true
	case ast.KindBinaryExpression:
		expression := node.AsBinaryExpression()
		if expression.OperatorToken.Kind == ast.KindCommaToken {
			return SemanticExpressionStatic(context, expression.Right, depth+1)
		}
		left, leftOK := SemanticExpressionStatic(context, expression.Left, depth+1)
		right, rightOK := SemanticExpressionStatic(context, expression.Right, depth+1)
		if !leftOK || !rightOK {
			return nil, false
		}
		switch expression.OperatorToken.Kind {
		case ast.KindPlusToken:
			_, leftString := left.(string)
			_, rightString := right.(string)
			if leftString || rightString {
				return stringutil.CombineSurrogatePairs(SemanticExpressionString(left) + SemanticExpressionString(right)), true
			}
			return SemanticExpressionNumber(left) + SemanticExpressionNumber(right), true
		case ast.KindMinusToken:
			return SemanticExpressionNumber(left) - SemanticExpressionNumber(right), true
		case ast.KindAsteriskToken:
			return SemanticExpressionNumber(left) * SemanticExpressionNumber(right), true
		case ast.KindSlashToken:
			return SemanticExpressionNumber(left) / SemanticExpressionNumber(right), true
		case ast.KindCommaToken:
			return right, true
		}
	case ast.KindArrayLiteralExpression:
		var values []any
		for _, element := range node.AsArrayLiteralExpression().Elements.Nodes {
			if element.Kind == ast.KindOmittedExpression {
				values = append(values, nil)
				continue
			}
			value, known := SemanticExpressionStatic(context, element, depth+1)
			if !known {
				return nil, false
			}
			values = append(values, value)
		}
		return values, true
	case ast.KindObjectLiteralExpression:
		values := make(map[string]any)
		for _, property := range node.AsObjectLiteralExpression().Properties.Nodes {
			if property.Kind != ast.KindPropertyAssignment {
				return nil, false
			}
			value, known := SemanticExpressionStatic(context, property.Initializer(), depth+1)
			if !known {
				return nil, false
			}
			key := property.Name().Text()
			if property.Name().Kind == ast.KindComputedPropertyName {
				computed, known := SemanticExpressionStatic(context, property.Name().Expression(), depth+1)
				if !known {
					return nil, false
				}
				key = SemanticExpressionString(computed)
			}
			values[key] = value
		}
		return values, true
	case ast.KindPropertyAccessExpression, ast.KindElementAccessExpression:
		object, property := node.Expression(), node.Name()
		key := ""
		if node.Kind == ast.KindElementAccessExpression {
			property = node.AsElementAccessExpression().ArgumentExpression
			value, known := SemanticExpressionStatic(context, property, depth+1)
			if !known {
				return nil, false
			}
			key = SemanticExpressionString(value)
		} else {
			key = property.Text()
		}
		value, known := SemanticExpressionStatic(context, object, depth+1)
		if !known {
			return nil, false
		}
		switch value := value.(type) {
		case map[string]any:
			part, exists := value[key]
			if !exists {
				return SemanticExpressionUndefined{}, true
			}
			return part, true
		case []any:
			if key == "length" {
				return float64(len(value)), true
			}
			index, err := strconv.Atoi(key)
			if err == nil && index >= 0 && index < len(value) {
				return value[index], true
			}
		case string:
			if key == "length" {
				return float64(SemanticExpressionStringLength(value)), true
			}
		case SemanticExpressionRegex:
			if key == "source" {
				return value.pattern, true
			}
			if key == "flags" {
				return value.Flags, true
			}
			if key == "global" {
				return strings.Contains(value.Flags, "g"), true
			}
		}
	case ast.KindTemplateExpression:
		expression := node.AsTemplateExpression()
		var value strings.Builder
		value.WriteString(expression.Head.Text())
		for _, span := range expression.TemplateSpans.Nodes {
			part, known := SemanticExpressionStatic(context, span.Expression(), depth+1)
			if !known {
				return nil, false
			}
			value.WriteString(SemanticExpressionString(part))
			value.WriteString(span.AsTemplateSpan().Literal.Text())
		}
		return stringutil.CombineSurrogatePairs(value.String()), true
	case ast.KindTaggedTemplateExpression:
		expression := node.AsTaggedTemplateExpression()
		object, _, name, _ := SemanticExpressionMember(context, expression.Tag)
		if name == "raw" && SemanticExpressionGlobal(context, object, "String") && expression.Template.Kind == ast.KindNoSubstitutionTemplateLiteral {
			raw := SemanticExpressionText(context, expression.Template)
			return strings.ReplaceAll(raw[1:len(raw)-1], "\r\n", "\n"), true
		}
	case ast.KindCallExpression, ast.KindNewExpression:
		if !semanticExpressionRegexpConstructor(context, node.Expression(), depth+1) {
			return nil, false
		}
		var arguments []*ast.Node
		if node.Kind == ast.KindCallExpression {
			arguments = node.AsCallExpression().Arguments.Nodes
		} else if node.AsNewExpression().Arguments != nil {
			arguments = node.AsNewExpression().Arguments.Nodes
		}
		pattern, flags := "", ""
		if len(arguments) > 0 {
			value, known := SemanticExpressionStatic(context, arguments[0], depth+1)
			if !known {
				return nil, false
			}
			if regex, ok := value.(SemanticExpressionRegex); ok {
				pattern, flags = regex.pattern, regex.Flags
			} else if _, undefined := value.(SemanticExpressionUndefined); !undefined {
				pattern = SemanticExpressionString(value)
			}
		}
		if len(arguments) > 1 {
			value, known := SemanticExpressionStatic(context, arguments[1], depth+1)
			if !known {
				return nil, false
			}
			if _, undefined := value.(SemanticExpressionUndefined); !undefined {
				flags = SemanticExpressionString(value)
			}
		}
		if pattern == "" {
			pattern = "(?:)"
		}
		if scanner.ParseRegExpLint(pattern, flags).Valid {
			return SemanticExpressionRegex{pattern, flags}, true
		}
	}
	return nil, false
}

func semanticExpressionImmutable(context Context, declaration *ast.Node, symbol *ast.Symbol) bool {
	if declaration.Parent.Flags&ast.NodeFlagsConst != 0 {
		return true
	}
	written := false
	var visit func(*ast.Node)
	visit = func(node *ast.Node) {
		if written {
			return
		}
		var target *ast.Node
		if node.Kind == ast.KindBinaryExpression && ast.IsAssignmentOperator(node.AsBinaryExpression().OperatorToken.Kind) {
			target = ast.SkipParentheses(node.AsBinaryExpression().Left)
		}
		if node.Kind == ast.KindPrefixUnaryExpression {
			expression := node.AsPrefixUnaryExpression()
			if expression.Operator == ast.KindPlusPlusToken || expression.Operator == ast.KindMinusMinusToken {
				target = ast.SkipParentheses(expression.Operand)
			}
		}
		if node.Kind == ast.KindPostfixUnaryExpression {
			target = ast.SkipParentheses(node.AsPostfixUnaryExpression().Operand)
		}
		if target != nil && target.Kind == ast.KindIdentifier && context.GetChecker().GetSymbolAtLocation(target) == symbol {
			written = true
			return
		}
		node.ForEachChild(func(child *ast.Node) bool { visit(child); return written })
	}
	visit(context.File.AsNode())
	return !written
}

func semanticExpressionTruthy(value any) bool {
	switch value := value.(type) {
	case nil, SemanticExpressionUndefined:
		return false
	case bool:
		return value
	case float64:
		return value != 0 && !math.IsNaN(value)
	case *big.Int:
		return value.Sign() != 0
	case string:
		return value != ""
	default:
		return true
	}
}

func SemanticExpressionRegexText(context Context, node *ast.Node, anchored bool) (text string, ends, known bool) {
	value, ok := SemanticExpressionStatic(context, node, 0)
	regex, okRegex := value.(SemanticExpressionRegex)
	if !ok || !okRegex {
		return "", false, false
	}
	if anchored && strings.ContainsAny(regex.Flags, "im") || !anchored && strings.ContainsAny(regex.Flags, "ig") {
		return "", false, false
	}
	parsed := scanner.ParseRegExpLint(regex.pattern, regex.Flags)
	if !parsed.Valid || len(parsed.Root.Children) != 1 {
		return "", false, false
	}
	elements := parsed.Root.Children[0].Children
	if anchored {
		if len(elements) == 0 {
			return "", false, false
		}
		first, last := elements[0], elements[len(elements)-1]
		start := first.Kind == scanner.RegExpLintAssertion && regex.pattern[first.Start:first.End] == "^"
		end := last.Kind == scanner.RegExpLintAssertion && regex.pattern[last.Start:last.End] == "$" && len(regex.pattern) > 1
		if start == end {
			return "", false, false
		}
		ends = end
		if start {
			elements = elements[1:]
		} else {
			elements = elements[:len(elements)-1]
		}
	}
	var result strings.Builder
	for _, element := range elements {
		if element.Kind != scanner.RegExpLintCharacter {
			return "", false, false
		}
		result.WriteString(stringutil.EncodeJSStringRune(element.Value))
	}
	return stringutil.CombineSurrogatePairs(result.String()), ends, true
}

func SemanticExpressionQuote(value string, single bool) string {
	quote := byte('"')
	if single {
		quote = '\''
	}
	var result strings.Builder
	result.WriteByte(quote)
	for len(value) > 0 {
		character, width := stringutil.DecodeJSStringRune(value)
		value = value[width:]
		switch character {
		case '\\':
			result.WriteString(`\\`)
		case '\n':
			result.WriteString(`\n`)
		case '\r':
			result.WriteString(`\r`)
		case '\t':
			result.WriteString(`\t`)
		case '\b':
			result.WriteString(`\b`)
		case '\f':
			result.WriteString(`\f`)
		default:
			if character == rune(quote) {
				result.WriteByte('\\')
				result.WriteRune(character)
			} else if character < 32 || character == 0x2028 || character == 0x2029 || stringutil.IsSurrogate(character) {
				fmt.Fprintf(&result, `\u%04x`, character)
			} else {
				result.WriteRune(character)
			}
		}
	}
	result.WriteByte(quote)
	return result.String()
}

func SemanticExpressionReceiverText(context Context, node *ast.Node) string {
	switch node.Kind {
	case ast.KindIdentifier, ast.KindStringLiteral, ast.KindNoSubstitutionTemplateLiteral, ast.KindTemplateExpression, ast.KindRegularExpressionLiteral, ast.KindPropertyAccessExpression, ast.KindElementAccessExpression, ast.KindCallExpression, ast.KindNewExpression, ast.KindParenthesizedExpression, ast.KindArrayLiteralExpression, ast.KindThisKeyword:
		return SemanticExpressionText(context, node)
	default:
		return "(" + SemanticExpressionText(context, node) + ")"
	}
}

func SemanticExpressionCallText(context Context, node *ast.Node) string {
	if node.Kind == ast.KindBinaryExpression && node.AsBinaryExpression().OperatorToken.Kind == ast.KindCommaToken {
		return "(" + SemanticExpressionText(context, node) + ")"
	}
	return SemanticExpressionText(context, node)
}

func SemanticExpressionStringLength(text string) int {
	length := 0
	for len(text) > 0 {
		character, width := stringutil.DecodeJSStringRune(text)
		text = text[width:]
		length++
		if character > 0xffff {
			length++
		}
	}
	return length
}
