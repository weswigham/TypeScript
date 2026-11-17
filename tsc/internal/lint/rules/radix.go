package rules

import (
	"math"
	"strconv"
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

func radixNumeric(node *ast.Node) (float64, bool) {
	node = ast.SkipParentheses(node)
	sign := 1.0
	if node.Kind == ast.KindPrefixUnaryExpression {
		unary := node.AsPrefixUnaryExpression()
		if unary.Operator != ast.KindPlusToken && unary.Operator != ast.KindMinusToken {
			return 0, false
		}
		if unary.Operator == ast.KindMinusToken {
			sign = -1
		}
		node = ast.SkipParentheses(unary.Operand)
	}
	if node.Kind != ast.KindNumericLiteral {
		return 0, false
	}
	text := strings.ReplaceAll(node.Text(), "_", "")
	if len(text) > 2 && text[0] == '0' && strings.ContainsAny(text[1:2], "xXoObB") {
		value, err := strconv.ParseUint(text, 0, 64)
		return sign * float64(value), err == nil
	}
	value, err := strconv.ParseFloat(text, 64)
	return sign * value, err == nil
}

type radixRule struct{ context Context }

func newRadixRule(context Context) Rule {
	return &radixRule{context: context}
}

func (rule *radixRule) OnEnterNode(node *ast.Node) bool {
	rule.radix(node)
	return true
}

func (rule *radixRule) OnExitNode(node *ast.Node) {}

func (rule *radixRule) radix(node *ast.Node) {
	if node.Kind != ast.KindCallExpression {
		return
	}
	callee := ast.SkipParentheses(node.Expression())
	if ast.IsAccessExpression(callee) && helpers.StatementPropertyName(callee) == "parseInt" {
		callee = ast.SkipParentheses(callee.Expression())
		if callee.Kind != ast.KindIdentifier || callee.Text() != "Number" {
			return
		}
	} else if callee.Kind != ast.KindIdentifier || callee.Text() != "parseInt" {
		return
	}
	if !helpers.StatementBuiltin(rule.context, callee, true) {
		return
	}
	arguments := node.Arguments()
	for index := range min(2, len(arguments)) {
		if arguments[index].Kind == ast.KindSpreadElement {
			return
		}
	}
	if len(arguments) == 0 {
		rule.context.Report(rule.context.Range(node), diagnostics.Missing_parameters)
	} else if len(arguments) == 1 {
		rule.context.Report(rule.context.Range(node), diagnostics.Missing_radix_parameter)
	} else {
		radix := ast.SkipParentheses(arguments[1])
		invalid := false
		if value, numeric := radixNumeric(radix); numeric {
			invalid = value < 2 || value > 36 || math.Trunc(value) != value
		} else {
			switch radix.Kind {
			case ast.KindStringLiteral, ast.KindBigIntLiteral, ast.KindRegularExpressionLiteral, ast.KindTrueKeyword, ast.KindFalseKeyword, ast.KindNullKeyword:
				invalid = true
			case ast.KindIdentifier:
				invalid = radix.Text() == "undefined" && helpers.StatementBuiltin(rule.context, radix, true)
			}
		}
		if invalid {
			rule.context.Report(rule.context.Range(node), diagnostics.Invalid_radix_parameter_must_be_an_integer_between_2_and_36)
		}
	}
}
