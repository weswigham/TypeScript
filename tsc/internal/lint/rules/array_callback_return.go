package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/ls/change"
)

type arrayCallbackReturn struct{ helpers.ReturnRuleContext }

func (rule *arrayCallbackReturn) OnEnterNode(node *ast.Node) bool { return true }
func (rule *arrayCallbackReturn) OnExitNode(node *ast.Node) {
	if !helpers.ReturnFunction(node) {
		return
	}
	returns, normal, _ := helpers.AnalyzeFunctionReturns(node)
	rule.arrayCallback(node, returns, normal)
}

func returnArrayMethod(node *ast.Node) string {
	if node.Kind != ast.KindFunctionExpression && node.Kind != ast.KindArrowFunction || helpers.ReturnGenerator(node) {
		return ""
	}
	current := helpers.ReturnOuter(node)
	for current.Parent != nil {
		parent := current.Parent
		switch parent.Kind {
		case ast.KindConditionalExpression:
			current = helpers.ReturnOuter(parent)
		case ast.KindBinaryExpression:
			operator := parent.AsBinaryExpression().OperatorToken.Kind
			if operator != ast.KindBarBarToken && operator != ast.KindAmpersandAmpersandToken && operator != ast.KindQuestionQuestionToken {
				return ""
			}
			current = helpers.ReturnOuter(parent)
		case ast.KindReturnStatement:
			owner := parent.Parent
			for owner != nil && !helpers.ReturnFunction(owner) {
				owner = owner.Parent
			}
			if owner == nil {
				return ""
			}
			outer := helpers.ReturnOuter(owner)
			if outer.Parent == nil || outer.Parent.Kind != ast.KindCallExpression || outer.Parent.Expression() != outer {
				return ""
			}
			current = helpers.ReturnOuter(outer.Parent)
		case ast.KindCallExpression:
			call := parent.AsCallExpression()
			receiver, name := helpers.ReturnMember(call.Expression)
			if receiver == nil || call.Arguments == nil {
				return ""
			}
			arguments := call.Arguments.Nodes
			if (name == "from" || name == "fromAsync") && len(arguments) >= 2 && arguments[1] == current && ast.SkipParentheses(receiver).Kind == ast.KindIdentifier && ast.SkipParentheses(receiver).Text() == "Array" {
				if name == "fromAsync" || !helpers.ReturnAsync(node) {
					return name
				}
			}
			if helpers.ReturnAsync(node) || len(arguments) == 0 || arguments[0] != current {
				return ""
			}
			switch name {
			case "every", "filter", "find", "findLast", "findIndex", "findLastIndex", "flatMap", "forEach", "map", "reduce", "reduceRight", "some", "sort", "toSorted":
				return name
			}
			return ""
		default:
			return ""
		}
	}
	return ""
}

func (rule *arrayCallbackReturn) prependVoid(report *ast.Diagnostic, expression *ast.Node) {
	rule.Suggestion("array-callback-return", report, diagnostics.Prepend_void_to_the_expression, func(tracker *change.Tracker) {
		start, end := rule.Start(expression), expression.End()
		inner := ast.SkipParentheses(expression)
		needsParens := expression == inner
		switch inner.Kind {
		case ast.KindIdentifier, ast.KindStringLiteral, ast.KindNumericLiteral, ast.KindCallExpression, ast.KindPropertyAccessExpression, ast.KindElementAccessExpression, ast.KindNewExpression, ast.KindParenthesizedExpression, ast.KindObjectLiteralExpression, ast.KindArrayLiteralExpression, ast.KindFunctionExpression, ast.KindClassExpression, ast.KindPrefixUnaryExpression, ast.KindPostfixUnaryExpression, ast.KindTypeOfExpression, ast.KindVoidExpression, ast.KindDeleteExpression, ast.KindAwaitExpression, ast.KindTrueKeyword, ast.KindFalseKeyword, ast.KindNullKeyword, ast.KindThisKeyword, ast.KindTemplateExpression, ast.KindNoSubstitutionTemplateLiteral:
			needsParens = false
		}
		prefix, suffix := "void ", ""
		if needsParens {
			prefix, suffix = "void (", ")"
		}
		if start > 0 && rule.Context.File.Text()[start-1] == 'n' {
			prefix = " " + prefix
		}
		tracker.ReplaceTextRangeWithText(rule.Context.File, core.NewTextRange(start, start), prefix)
		if suffix != "" {
			tracker.ReplaceTextRangeWithText(rule.Context.File, core.NewTextRange(end, end), suffix)
		}
	})
}

func (rule *arrayCallbackReturn) arrayCallback(node *ast.Node, returns []*ast.Node, normal bool) {
	method := returnArrayMethod(node)
	if method == "" {
		return
	}
	fullName := "Array.prototype." + method
	if method == "from" || method == "fromAsync" {
		fullName = "Array." + method
	}
	name := helpers.ReturnName(node)
	if method == "forEach" {
		if !rule.Option("checkForEach", false) {
			return
		}
		allowVoid := rule.Option("allowVoid", false)
		for _, statement := range returns {
			expression := statement.Expression()
			if expression != nil && !(allowVoid && ast.SkipParentheses(expression).Kind == ast.KindVoidExpression) {
				report := rule.Context.Report(rule.Context.Range(statement), diagnostics.X_0_expects_no_useless_return_value_from_1, fullName, name)
				if allowVoid {
					rule.prependVoid(report, expression)
				}
			}
		}
		body := node.Body()
		if node.Kind == ast.KindArrowFunction && body.Kind != ast.KindBlock && !(allowVoid && ast.SkipParentheses(body).Kind == ast.KindVoidExpression) {
			report := rule.Context.Report(rule.Head(node, false), diagnostics.X_0_expects_no_useless_return_value_from_1, fullName, name)
			rule.Suggestion("array-callback-return", report, diagnostics.Wrap_the_expression_in, func(tracker *change.Tracker) {
				tracker.ReplaceTextRangeWithText(rule.Context.File, core.NewTextRange(rule.Start(body), rule.Start(body)), "{")
				tracker.ReplaceTextRangeWithText(rule.Context.File, core.NewTextRange(body.End(), body.End()), "}")
			})
			if allowVoid {
				rule.prependVoid(report, body)
			}
		}
		return
	}
	if !rule.Option("allowImplicit", false) {
		for _, statement := range returns {
			if statement.Expression() == nil {
				rule.Context.Report(rule.Context.Range(statement), diagnostics.X_0_expects_a_return_value_from_1, fullName, name)
			}
		}
	}
	if node.Body().Kind == ast.KindBlock && normal {
		message := diagnostics.X_0_expects_a_return_value_from_1
		if len(returns) != 0 {
			message = diagnostics.X_0_expects_a_value_to_be_returned_at_the_end_of_1
		}
		rule.Context.Report(rule.Head(node, false), message, fullName, name)
	}
}

func newArrayCallbackReturn(context Context) Rule {
	return &arrayCallbackReturn{Context: context}
}
