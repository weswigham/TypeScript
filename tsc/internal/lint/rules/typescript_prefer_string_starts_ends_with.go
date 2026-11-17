package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type typeScriptPreferStringStartsEndsWith struct {
	context     Context
	suggestions map[*ast.Diagnostic][]*codefix.CodeFixAction
}

func newTypeScriptPreferStringStartsEndsWith(context Context) Rule {
	return &typeScriptPreferStringStartsEndsWith{context: context, suggestions: make(map[*ast.Diagnostic][]*codefix.CodeFixAction)}
}

func (rule *typeScriptPreferStringStartsEndsWith) Suggestions() map[*ast.Diagnostic][]*codefix.CodeFixAction {
	return rule.suggestions
}

func (rule *typeScriptPreferStringStartsEndsWith) OnEnterNode(node *ast.Node) bool {
	if rule.context.GetChecker != nil {
		rule.startsEnds(node)
	}
	return true
}

func (rule *typeScriptPreferStringStartsEndsWith) OnExitNode(node *ast.Node) {}

func (rule *typeScriptPreferStringStartsEndsWith) action(diagnostic *ast.Diagnostic, description *ast.Diagnostic, suggestion bool, edits ...helpers.SemanticExpressionEdit) {
	if rule.context.NewTracker == nil {
		return
	}
	tracker := rule.context.NewTracker()
	for _, edit := range edits {
		tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(edit.Start, edit.End), edit.Text)
	}
	name := "@typescript-eslint/" + "prefer-string-starts-ends-with"
	action := codefix.CreateCodeFixAction(name, tracker.GetTextChanges(), description, name, description)
	if suggestion {
		rule.suggestions[diagnostic] = append(rule.suggestions[diagnostic], action)
	} else {
		diagnostic.SetCodeFixes(action)
	}
}

func (rule *typeScriptPreferStringStartsEndsWith) replace(diagnostic *ast.Diagnostic, node *ast.Node, text string) {
	description := diagnostic
	rule.action(diagnostic, description, false, helpers.SemanticExpressionEdit{Start: helpers.SemanticExpressionStart(rule.context, node), End: node.End(), Text: text})
}

func (rule *typeScriptPreferStringStartsEndsWith) sameTokens(left, right *ast.Node) bool {
	leftScanner, rightScanner := scanner.NewScanner(), scanner.NewScanner()
	leftText, rightText := helpers.SemanticExpressionText(rule.context, left), helpers.SemanticExpressionText(rule.context, right)
	leftScanner.SetText(leftText)
	rightScanner.SetText(rightText)
	leftScanner.SetSkipTrivia(true)
	rightScanner.SetSkipTrivia(true)
	for {
		leftKind, rightKind := leftScanner.Scan(), rightScanner.Scan()
		if leftKind != rightKind {
			return false
		}
		if leftKind == ast.KindEndOfFile {
			return true
		}
		if leftText[leftScanner.TokenStart():leftScanner.TokenEnd()] != rightText[rightScanner.TokenStart():rightScanner.TokenEnd()] {
			return false
		}
	}
}

func (rule *typeScriptPreferStringStartsEndsWith) lengthExpression(node, object *ast.Node) bool {
	node = ast.SkipParentheses(node)
	if receiver, _, name, _ := helpers.SemanticExpressionMember(rule.context, node); receiver != nil && name == "length" && rule.sameTokens(receiver, object) {
		return true
	}
	length, lengthKnown := helpers.SemanticExpressionStatic(rule.context, node, 0)
	text, textKnown := helpers.SemanticExpressionStatic(rule.context, object, 0)
	number, numeric := length.(float64)
	value, isString := text.(string)
	return lengthKnown && textKnown && numeric && isString && number == float64(helpers.SemanticExpressionStringLength(value))
}

func (rule *typeScriptPreferStringStartsEndsWith) lengthAhead(node, substring, parent *ast.Node) bool {
	node = ast.SkipParentheses(node)
	if node.Kind == ast.KindPrefixUnaryExpression {
		expression := node.AsPrefixUnaryExpression()
		return expression.Operator == ast.KindMinusToken && rule.lengthExpression(expression.Operand, substring)
	}
	if node.Kind == ast.KindBinaryExpression {
		expression := node.AsBinaryExpression()
		return expression.OperatorToken.Kind == ast.KindMinusToken && rule.lengthExpression(expression.Left, parent) && rule.lengthExpression(expression.Right, substring)
	}
	return false
}

func typeScriptPreferStringStartsEndsWithEquality(kind ast.Kind) bool {
	return kind == ast.KindEqualsEqualsToken || kind == ast.KindEqualsEqualsEqualsToken || kind == ast.KindExclamationEqualsToken || kind == ast.KindExclamationEqualsEqualsToken
}

func typeScriptPreferStringStartsEndsWithNegative(kind ast.Kind) bool {
	return kind == ast.KindExclamationEqualsToken || kind == ast.KindExclamationEqualsEqualsToken
}

func (rule *typeScriptPreferStringStartsEndsWith) startsReport(node *ast.Node, ends bool) *ast.Diagnostic {
	message := diagnostics.Use_String_startsWith_method_instead
	if ends {
		message = diagnostics.Use_the_String_endsWith_method_instead
	}
	return rule.context.Report(rule.context.Range(node), message)
}

func (rule *typeScriptPreferStringStartsEndsWith) stringMethod(object *ast.Node, optional, ends bool) string {
	method := "startsWith"
	if ends {
		method = "endsWith"
	}
	separator := "."
	if optional {
		separator = "?."
	}
	return helpers.SemanticExpressionReceiverText(rule.context, object) + separator + method
}

func (rule *typeScriptPreferStringStartsEndsWith) startsEnds(node *ast.Node) {
	if node.Kind == ast.KindCallExpression && len(node.AsCallExpression().Arguments.Nodes) == 1 {
		member := ast.SkipParentheses(node.Expression())
		object, _, name, optional := helpers.SemanticExpressionMember(rule.context, member)
		if member.Kind == ast.KindPropertyAccessExpression && name == "test" {
			text, ends, known := helpers.SemanticExpressionRegexText(rule.context, object, true)
			if known {
				diagnostic := rule.startsReport(node, ends)
				rule.replace(diagnostic, node, rule.stringMethod(node.AsCallExpression().Arguments.Nodes[0], optional, ends)+"("+helpers.SemanticExpressionQuote(text, false)+")")
			}
		}
	}
	if node.Kind != ast.KindBinaryExpression {
		return
	}
	expression := node.AsBinaryExpression()
	left, right := ast.SkipParentheses(expression.Left), expression.Right
	member := left
	var arguments []*ast.Node
	if left.Kind == ast.KindCallExpression {
		member = ast.SkipParentheses(left.Expression())
		arguments = left.AsCallExpression().Arguments.Nodes
	}
	object, property, name, optional := helpers.SemanticExpressionMember(rule.context, member)
	if object == nil || !helpers.SemanticExpressionNodeIsString(rule.context, object) {
		return
	}
	negative := typeScriptPreferStringStartsEndsWithNegative(expression.OperatorToken.Kind)
	ends, recognized, safe := false, false, true
	useArgument := false
	var index *ast.Node
	if left.Kind == ast.KindElementAccessExpression {
		index = property
	} else if left.Kind == ast.KindCallExpression && member.Kind == ast.KindPropertyAccessExpression && name == "charAt" && len(arguments) == 1 {
		index = arguments[0]
	}
	if index != nil {
		if !typeScriptPreferStringStartsEndsWithEquality(expression.OperatorToken.Kind) {
			return
		}
		index = ast.SkipParentheses(index)
		if index.Kind == ast.KindBinaryExpression {
			difference := index.AsBinaryExpression()
			ends = difference.OperatorToken.Kind == ast.KindMinusToken && rule.lengthExpression(difference.Left, object) && helpers.SemanticExpressionNodeIsNumber(rule.context, difference.Right, 1)
		}
		recognized = ends || helpers.SemanticExpressionNodeIsNumber(rule.context, index, 0)
		if allow, _ := helpers.SemanticExpressionOption(rule.context, 0)["allowSingleElementEquality"].(string); allow == "always" {
			return
		}
		value, known := helpers.SemanticExpressionStatic(rule.context, right, 0)
		character, isString := value.(string)
		safe = known && isString && helpers.SemanticExpressionStringLength(character) == 1
	} else if left.Kind == ast.KindCallExpression {
		switch {
		case member.Kind == ast.KindPropertyAccessExpression && name == "indexOf" && len(arguments) == 1:
			recognized = typeScriptPreferStringStartsEndsWithEquality(expression.OperatorToken.Kind) && helpers.SemanticExpressionNodeIsNumber(rule.context, right, 0)
			useArgument = true
		case member.Kind == ast.KindPropertyAccessExpression && name == "lastIndexOf" && len(arguments) == 1:
			if typeScriptPreferStringStartsEndsWithEquality(expression.OperatorToken.Kind) && ast.SkipParentheses(right).Kind == ast.KindBinaryExpression {
				difference := ast.SkipParentheses(right).AsBinaryExpression()
				recognized = difference.OperatorToken.Kind == ast.KindMinusToken && rule.lengthExpression(difference.Left, object) && rule.lengthExpression(difference.Right, arguments[0])
			}
			ends, useArgument = true, true
		case member.Kind == ast.KindPropertyAccessExpression && name == "match":
			value, known := helpers.SemanticExpressionStatic(rule.context, right, 0)
			_, undefined := value.(helpers.SemanticExpressionUndefined)
			if !known || value != nil && !undefined || len(arguments) != 1 {
				return
			}
			text, regexEnds, known := helpers.SemanticExpressionRegexText(rule.context, arguments[0], true)
			if !known {
				return
			}
			diagnostic := rule.startsReport(left, regexEnds)
			replacement := rule.stringMethod(object, optional, regexEnds) + "(" + helpers.SemanticExpressionQuote(text, false) + ")"
			if !negative {
				replacement = "!" + replacement
			}
			rule.replace(diagnostic, node, replacement)
			return
		case name == "slice" || name == "substring":
			if !typeScriptPreferStringStartsEndsWithEquality(expression.OperatorToken.Kind) {
				return
			}
			if len(arguments) == 1 {
				ends = rule.lengthAhead(arguments[0], right, object)
				recognized = ends
			} else if len(arguments) == 2 {
				if helpers.SemanticExpressionNodeIsNumber(rule.context, arguments[0], 0) && rule.lengthExpression(arguments[1], right) {
					recognized = true
				} else if (rule.lengthExpression(arguments[1], object) || helpers.SemanticExpressionNodeIsNumber(rule.context, arguments[1], 0)) && rule.lengthAhead(arguments[0], right, object) {
					recognized, ends = true, true
				}
			}
			if expression.OperatorToken.Kind == ast.KindEqualsEqualsToken || expression.OperatorToken.Kind == ast.KindExclamationEqualsToken {
				literal := ast.SkipParentheses(right)
				safe = literal.Kind == ast.KindStringLiteral
			}
			if ends && len(arguments) > 0 {
				position := ast.SkipParentheses(arguments[0])
				if position.Kind == ast.KindPrefixUnaryExpression {
					safe = safe && member.Kind == ast.KindPropertyAccessExpression && name == "slice"
				}
			}
		}
	}
	if !recognized {
		return
	}
	diagnostic := rule.startsReport(node, ends)
	if !safe {
		return
	}
	search := helpers.SemanticExpressionCallText(rule.context, right)
	if useArgument {
		search = helpers.SemanticExpressionCallText(rule.context, arguments[0])
	}
	replacement := rule.stringMethod(object, optional, ends) + "(" + search + ")"
	if useArgument {
		argumentStart := left.Expression().End()
		replacement = rule.stringMethod(object, optional, ends) + rule.context.File.Text()[argumentStart:left.End()]
	}
	if negative {
		replacement = "!" + replacement
	}
	rule.replace(diagnostic, node, replacement)
}
