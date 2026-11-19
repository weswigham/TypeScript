package rules

import (
	"strings"
	"unicode"
	"unicode/utf8"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type newCapRule struct {
	context Context
}

func newNewCap(context Context) Rule {
	rule := &newCapRule{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindCallExpression, ast.KindNewExpression},
	}
}

func (rule *newCapRule) OnEnterNode(node *ast.Node) bool {
	if node.Kind != ast.KindCallExpression && node.Kind != ast.KindNewExpression {
		return true
	}
	options := helpers.SyntaxObject(rule.context, 0)
	constructor := node.Kind == ast.KindNewExpression
	prefix := "capIsNew"
	if constructor {
		prefix = "newIsCap"
	}
	if !helpers.BooleanOptionValue(options, prefix, true) {
		return true
	}
	callee := ast.SkipParentheses(node.Expression())
	name := ""
	reportNode := callee
	if callee.Kind == ast.KindIdentifier {
		name = callee.Text()
	} else if ast.IsAccessExpression(callee) {
		if !helpers.BooleanOptionValue(options, "properties", true) {
			return true
		}
		name = helpers.AccessPropertyNameText(callee)
		if callee.Kind == ast.KindPropertyAccessExpression {
			reportNode = callee.Name()
		} else {
			reportNode = callee.AsElementAccessExpression().ArgumentExpression
		}
	}
	if name == "" {
		return true
	}
	first, _ := utf8.DecodeRuneInString(name)
	if unicode.ToLower(first) == unicode.ToUpper(first) || constructor && first != unicode.ToLower(first) || !constructor && first == unicode.ToLower(first) {
		return true
	}
	start := scanner.GetTokenPosOfNode(node.Expression(), rule.context.File, false)
	text := rule.context.File.Text()[start:node.Expression().End()]
	if helpers.StringListOptionContains(options[prefix+"Exceptions"], name) || helpers.StringListOptionContains(options[prefix+"Exceptions"], text) {
		return true
	}
	if pattern := helpers.StringOptionValue(options[prefix+"ExceptionPattern"], ""); pattern != "" && helpers.MatchesRegularExpression(pattern, text) {
		return true
	}
	if !constructor {
		if strings.Contains("|Array|Boolean|Date|Error|Function|Number|Object|RegExp|String|Symbol|BigInt|", "|"+name+"|") && rule.globalBuiltin(callee, name) {
			return true
		}
		if name == "UTC" && ast.IsAccessExpression(callee) && rule.globalBuiltin(callee.Expression(), "Date") {
			return true
		}
		rule.context.Report(rule.context.Range(reportNode), diagnostics.A_function_with_a_name_starting_with_an_uppercase_letter_should_only_be_used_as_a_constructor)
	} else {
		rule.context.Report(rule.context.Range(reportNode), diagnostics.A_constructor_name_should_not_start_with_a_lowercase_letter)
	}
	return true
}

func (rule *newCapRule) global(identifier *ast.Node) bool {
	if identifier.Kind != ast.KindIdentifier {
		return false
	}
	if rule.context.GetChecker != nil {
		return helpers.StatementBuiltin(rule.context, identifier, false)
	}
	symbol := identifier.Symbol()
	return symbol == nil
}

func (rule *newCapRule) globalBuiltin(expression *ast.Node, name string) bool {
	expression = ast.SkipParentheses(expression)
	if expression.Kind == ast.KindIdentifier {
		return expression.Text() == name && rule.global(expression)
	}
	if ast.IsAccessExpression(expression) && helpers.AccessPropertyNameText(expression) == name {
		object := ast.SkipParentheses(expression.Expression())
		return object.Kind == ast.KindIdentifier && (object.Text() == "global" || object.Text() == "globalThis" || object.Text() == "self" || object.Text() == "window") && rule.global(object)
	}
	return false
}
