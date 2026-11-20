package helpers

import (
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type RegexSource struct {
	Context     Context
	suggestions map[*ast.Diagnostic][]*codefix.CodeFixAction
}

type RegexInput struct {
	Node, PatternNode, FlagsNode      *ast.Node
	Pattern, Flags, RawPattern        string
	Start                             int
	Literal, KnownPattern, KnownFlags bool
	Arguments                         []*ast.Node
}

func NewRegexSource(context Context) RegexSource {
	return RegexSource{Context: context, suggestions: make(map[*ast.Diagnostic][]*codefix.CodeFixAction)}
}

func ParseRegexInput(input *RegexInput) *scanner.RegExpLint {
	flags := ""
	if input.KnownFlags {
		flags = input.Flags
	}
	mode := ""
	if strings.Contains(flags, "u") {
		mode += "u"
	}
	if strings.Contains(flags, "v") {
		mode += "v"
	}
	return scanner.ParseRegExpLint(input.Pattern, mode)
}

func (rule *RegexSource) Input(node *ast.Node) *RegexInput {
	if node.Kind == ast.KindRegularExpressionLiteral {
		raw := rule.Text(node)
		slash := strings.LastIndexByte(raw, '/')
		if slash < 1 {
			return nil
		}
		return &RegexInput{Node: node, PatternNode: node, Pattern: raw[1:slash], Flags: raw[slash+1:], RawPattern: raw[1:slash], Start: rule.Start(node) + 1, Literal: true, KnownPattern: true, KnownFlags: true}
	}
	if node.Kind != ast.KindCallExpression && node.Kind != ast.KindNewExpression {
		return nil
	}
	if !rule.constructor(node.Expression(), 0) {
		return nil
	}
	return rule.constructorArguments(node)
}

func (rule *RegexSource) DirectInput(node *ast.Node) *RegexInput {
	if node.Kind == ast.KindRegularExpressionLiteral {
		return rule.Input(node)
	}
	if node.Kind != ast.KindCallExpression && node.Kind != ast.KindNewExpression {
		return nil
	}
	if !rule.global(ast.SkipParentheses(node.Expression()), "RegExp") {
		return nil
	}
	input := rule.constructorArguments(node)
	if input.PatternNode != nil && input.PatternNode.Kind != ast.KindStringLiteral {
		input.KnownPattern = false
	}
	if input.FlagsNode != nil && input.FlagsNode.Kind != ast.KindStringLiteral {
		input.KnownFlags = false
	}
	return input
}

func (rule *RegexSource) constructorArguments(node *ast.Node) *RegexInput {
	input := &RegexInput{Node: node, KnownFlags: true}
	var arguments *ast.NodeList
	if node.Kind == ast.KindCallExpression {
		arguments = node.AsCallExpression().Arguments
	} else {
		arguments = node.AsNewExpression().Arguments
	}
	if arguments != nil {
		input.Arguments = arguments.Nodes
	}
	if len(input.Arguments) > 0 {
		input.PatternNode = ast.SkipParentheses(input.Arguments[0])
		input.Pattern, input.KnownPattern = rule.StaticString(input.PatternNode, 0)
		if input.PatternNode.Kind == ast.KindStringLiteral || input.PatternNode.Kind == ast.KindNoSubstitutionTemplateLiteral {
			raw := rule.Text(input.PatternNode)
			input.Start, input.RawPattern = rule.Start(input.PatternNode)+1, raw[1:len(raw)-1]
		}
	}
	if len(input.Arguments) > 1 {
		input.FlagsNode = ast.SkipParentheses(input.Arguments[1])
		input.Flags, input.KnownFlags = rule.StaticString(input.FlagsNode, 0)
	}
	return input
}

func (rule *RegexSource) Suggestions() map[*ast.Diagnostic][]*codefix.CodeFixAction {
	return rule.suggestions
}

func (rule *RegexSource) Start(node *ast.Node) int {
	return scanner.GetTokenPosOfNode(node, rule.Context.File, false)
}

func (rule *RegexSource) Text(node *ast.Node) string {
	return rule.Context.File.Text()[rule.Start(node):node.End()]
}

func (rule *RegexSource) Options() map[string]any {
	if len(rule.Context.Options) > 0 {
		options, _ := rule.Context.Options[0].(map[string]any)
		return options
	}
	return nil
}

func (rule *RegexSource) Option(name string) bool {
	value, _ := rule.Options()[name].(bool)
	return value
}

func (rule *RegexSource) global(node *ast.Node, name string) bool {
	if node == nil || node.Kind != ast.KindIdentifier || node.Text() != name {
		return false
	}
	if rule.Context.GetChecker == nil {
		return false
	}
	symbol := rule.Context.GetChecker().GetSymbolAtLocation(node)
	if symbol == nil {
		return true
	}
	for _, declaration := range symbol.Declarations() {
		if ast.GetSourceFileOfNode(declaration) == rule.Context.File && declaration.Kind != ast.KindInterfaceDeclaration && declaration.Kind != ast.KindTypeAliasDeclaration {
			return false
		}
	}
	return true
}

func (rule *RegexSource) constructor(node *ast.Node, depth int) bool {
	if node == nil || depth > 20 {
		return false
	}
	node = ast.SkipParentheses(node)
	if rule.global(node, "RegExp") {
		return true
	}
	if node.Kind == ast.KindPropertyAccessExpression || node.Kind == ast.KindElementAccessExpression {
		object := ast.SkipParentheses(node.Expression())
		if !ast.IsIdentifier(object) || object.Text() != "globalThis" && object.Text() != "window" && object.Text() != "global" && object.Text() != "self" {
			return false
		}
		var name string
		if node.Kind == ast.KindElementAccessExpression {
			var known bool
			name, known = rule.StaticString(node.AsElementAccessExpression().ArgumentExpression, depth+1)
			if !known {
				return false
			}
		} else if property := node.Name(); property != nil {
			name = property.Text()
		}
		if name != "RegExp" {
			return false
		}
		return rule.global(object, "globalThis") || rule.global(object, "window") || rule.global(object, "global") || rule.global(object, "self")
	}
	if node.Kind == ast.KindIdentifier && rule.Context.GetChecker != nil {
		if symbol := rule.Context.GetChecker().GetSymbolAtLocation(node); symbol != nil {
			for _, declaration := range symbol.Declarations() {
				if declaration.Kind == ast.KindVariableDeclaration && declaration.Initializer() != nil && rule.constructor(declaration.Initializer(), depth+1) {
					return true
				}
				if declaration.Kind == ast.KindBindingElement {
					binding := declaration.AsBindingElement()
					name := binding.PropertyName
					if name == nil {
						name = declaration.Name()
					}
					matches := false
					if name != nil {
						if name.Kind == ast.KindComputedPropertyName {
							value, known := rule.StaticString(name.AsComputedPropertyName().Expression, depth+1)
							matches = known && value == "RegExp"
						} else if ast.IsIdentifier(name) || ast.IsStringLiteralLike(name) {
							matches = name.Text() == "RegExp"
						}
					}
					if matches && declaration.Parent != nil && declaration.Parent.Parent != nil {
						initializer := declaration.Parent.Parent.Initializer()
						if initializer != nil && (rule.global(initializer, "globalThis") || rule.global(initializer, "window") || rule.global(initializer, "global")) {
							return true
						}
					}
				}
			}
		}
	}
	return false
}

func (rule *RegexSource) StaticString(node *ast.Node, depth int) (string, bool) {
	if node == nil || depth > 30 {
		return "", false
	}
	node = ast.SkipParentheses(node)
	switch node.Kind {
	case ast.KindStringLiteral, ast.KindNoSubstitutionTemplateLiteral, ast.KindNumericLiteral:
		return node.Text(), true
	case ast.KindTrueKeyword:
		return "true", true
	case ast.KindFalseKeyword:
		return "false", true
	case ast.KindNullKeyword:
		return "null", true
	case ast.KindIdentifier:
		if rule.global(node, "undefined") {
			return "undefined", true
		}
		if rule.Context.GetChecker != nil {
			if symbol := rule.Context.GetChecker().GetSymbolAtLocation(node); symbol != nil {
				for _, declaration := range symbol.Declarations() {
					if declaration.Kind == ast.KindVariableDeclaration && declaration.Initializer() != nil && declaration.Parent.Flags&ast.NodeFlagsConst != 0 {
						return rule.StaticString(declaration.Initializer(), depth+1)
					}
				}
			}
		}
	case ast.KindBinaryExpression:
		expression := node.AsBinaryExpression()
		if expression.OperatorToken.Kind == ast.KindPlusToken {
			left, leftOK := rule.StaticString(expression.Left, depth+1)
			right, rightOK := rule.StaticString(expression.Right, depth+1)
			return left + right, leftOK && rightOK
		}
	case ast.KindTemplateExpression:
		expression := node.AsTemplateExpression()
		var value strings.Builder
		value.WriteString(expression.Head.Text())
		for _, span := range expression.TemplateSpans.Nodes {
			text, ok := rule.StaticString(span.Expression(), depth+1)
			if !ok {
				return "", false
			}
			value.WriteString(text)
			value.WriteString(span.AsTemplateSpan().Literal.Text())
		}
		return value.String(), true
	case ast.KindTaggedTemplateExpression:
		expression := node.AsTaggedTemplateExpression()
		tag := ast.SkipParentheses(expression.Tag)
		if tag.Kind == ast.KindPropertyAccessExpression && tag.Name().Text() == "raw" && rule.global(tag.Expression(), "String") && expression.Template.Kind == ast.KindNoSubstitutionTemplateLiteral {
			raw := rule.Text(expression.Template)
			return strings.ReplaceAll(raw[1:len(raw)-1], "\r\n", "\n"), true
		}
	}
	return "", false
}

func (rule *RegexSource) PatternRange(input *RegexInput, start, end int) (int, int, bool) {
	node := input.PatternNode
	if node == nil {
		return 0, 0, false
	}
	if node.Kind == ast.KindRegularExpressionLiteral {
		return rule.Start(node) + 1 + start, rule.Start(node) + 1 + end, true
	}
	if node.Kind != ast.KindStringLiteral && node.Kind != ast.KindNoSubstitutionTemplateLiteral {
		return 0, 0, false
	}
	decoded, ranges := scanner.RegExpLintStringSource(rule.Text(node))
	if decoded != input.Pattern || start < 0 || end <= start || end > len(ranges) {
		return 0, 0, false
	}
	return rule.Start(node) + ranges[start].Start, rule.Start(node) + ranges[end-1].End, true
}
