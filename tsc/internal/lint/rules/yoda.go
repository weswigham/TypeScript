package rules

import (
	"math"
	"math/big"
	"slices"
	"strings"
	"unicode/utf16"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/jsnum"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/ls/change"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type yodaRule struct {
	context Context
}

func (rule *yodaRule) OnEnterNode(node *ast.Node) bool {
	rule.yoda(node)

	return true
}

func (rule *yodaRule) OnExitNode(node *ast.Node) {}

func (rule *yodaRule) Suggestions() map[*ast.Diagnostic][]*codefix.CodeFixAction {
	return nil
}

func (rule *yodaRule) boolean(index int, name string, fallback bool) bool {
	object, _ := rule.option(index).(map[string]any)
	if value, ok := object[name].(bool); ok {
		return value
	}
	return fallback
}

func (rule *yodaRule) option(index int) any {
	if index < len(rule.context.Options) {
		return rule.context.Options[index]
	}
	return nil
}

func (rule *yodaRule) rangeTest(node *ast.Node) bool {
	parent := node.Parent
	for parent != nil && parent.Kind == ast.KindParenthesizedExpression {
		node, parent = parent, parent.Parent
	}
	if parent == nil || parent.Kind != ast.KindBinaryExpression {
		return false
	}
	binary := parent.AsBinaryExpression()
	left, right := ast.SkipParentheses(binary.Left), ast.SkipParentheses(binary.Right)
	if !expressionRangeOperator(left) || !expressionRangeOperator(right) {
		return false
	}
	wrapped := parent.Parent != nil && parent.Parent.Kind == ast.KindParenthesizedExpression
	if !wrapped && parent.Parent != nil {
		switch parent.Parent.Kind {
		case ast.KindIfStatement, ast.KindWhileStatement, ast.KindDoStatement, ast.KindSwitchStatement, ast.KindWithStatement:
			wrapped = parent.Parent.Expression() == parent
		}
	}
	if !wrapped {
		return false
	}
	leftBinary, rightBinary := left.AsBinaryExpression(), right.AsBinaryExpression()
	var low, high *ast.Node
	if binary.OperatorToken.Kind == ast.KindAmpersandAmpersandToken && helpers.ExpressionSame(leftBinary.Right, rightBinary.Left, false) {
		low, high = leftBinary.Left, rightBinary.Right
	}
	if binary.OperatorToken.Kind == ast.KindBarBarToken && helpers.ExpressionSame(leftBinary.Left, rightBinary.Right, false) {
		low, high = leftBinary.Right, rightBinary.Left
	}
	if low == nil {
		return false
	}
	lowLiteral, highLiteral := expressionYodaLiteral(low), expressionYodaLiteral(high)
	return (lowLiteral || highLiteral) && (!lowLiteral || !highLiteral || expressionBoundsOrdered(low, high))
}

func (rule *yodaRule) replace(diagnostic *ast.Diagnostic, old *ast.Node, build func(*change.Tracker) *ast.Node) {
	if rule.context.NewTracker == nil {
		return
	}
	tracker := rule.context.NewTracker()
	tracker.ReplaceNodePreservingComments(rule.context.File, old, build(tracker))
	diagnostic.SetCodeFixes(codefix.CreateCodeFixAction("yoda", tracker.GetTextChanges(), ast.NewCompilerDiagnostic(diagnostics.Fix_0, "yoda"), "yoda", ast.NewCompilerDiagnostic(diagnostics.Fix_all_0, "yoda")))
}

func (rule *yodaRule) Start(node *ast.Node) int {
	return scanner.GetTokenPosOfNode(node, rule.context.File, false)
}

func (rule *yodaRule) yoda(node *ast.Node) {
	if node.Kind != ast.KindBinaryExpression {
		return
	}
	binary := node.AsBinaryExpression()
	operator := binary.OperatorToken.Kind
	if !helpers.ExpressionComparison(operator) || rule.boolean(1, "onlyEquality", false) && operator != ast.KindEqualsEqualsToken && operator != ast.KindEqualsEqualsEqualsToken {
		return
	}
	leftLiteral, rightLiteral := expressionYodaLiteral(binary.Left), expressionYodaLiteral(binary.Right)
	always := rule.option(0) == "always"
	if leftLiteral == rightLiteral || leftLiteral == always || rule.boolean(1, "exceptRange", false) && rule.rangeTest(node) {
		return
	}
	side := "right"
	if always {
		side = "left"
	}
	diagnostic := rule.context.Report(rule.context.Range(node), diagnostics.Expected_literal_to_be_on_the_0_side_of_1, side, scanner.TokenToString(operator))
	flipped := operator
	switch operator {
	case ast.KindLessThanToken:
		flipped = ast.KindGreaterThanToken
	case ast.KindLessThanEqualsToken:
		flipped = ast.KindGreaterThanEqualsToken
	case ast.KindGreaterThanToken:
		flipped = ast.KindLessThanToken
	case ast.KindGreaterThanEqualsToken:
		flipped = ast.KindLessThanEqualsToken
	}
	rule.replace(diagnostic, node, func(tracker *change.Tracker) *ast.Node {
		result := tracker.NewBinaryExpression(nil, binary.Right, nil, tracker.NewToken(flipped), binary.Left)
		statement := node
		for statement.Parent != nil && ast.IsExpression(statement.Parent) {
			statement = statement.Parent
		}
		if statement.Parent != nil && statement.Parent.Kind == ast.KindExpressionStatement && rule.Start(statement) == rule.Start(node) {
			switch ast.GetLeftmostExpression(binary.Right, false).Kind {
			case ast.KindObjectLiteralExpression, ast.KindFunctionExpression, ast.KindClassExpression:
				return tracker.NewParenthesizedExpression(result)
			}
		}
		return result
	})
}

func expressionYodaLiteral(node *ast.Node) bool {
	node = ast.SkipParentheses(node)
	if helpers.ExpressionLiteral(node) {
		return true
	}
	return node.Kind == ast.KindPrefixUnaryExpression && node.AsPrefixUnaryExpression().Operator == ast.KindMinusToken && (ast.SkipParentheses(node.AsPrefixUnaryExpression().Operand).Kind == ast.KindNumericLiteral || ast.SkipParentheses(node.AsPrefixUnaryExpression().Operand).Kind == ast.KindBigIntLiteral)
}

type expressionBound struct {
	text        string
	number      float64
	integer     *big.Int
	stringValue bool
}

func expressionBoundValue(node *ast.Node) expressionBound {
	node = ast.SkipParentheses(node)
	sign := 1.0
	if node.Kind == ast.KindPrefixUnaryExpression {
		sign = -1
		node = ast.SkipParentheses(node.AsPrefixUnaryExpression().Operand)
	}
	switch node.Kind {
	case ast.KindStringLiteral, ast.KindNoSubstitutionTemplateLiteral:
		return expressionBound{text: node.Text(), stringValue: true}
	case ast.KindNumericLiteral:
		return expressionBound{number: sign * float64(jsnum.FromString(node.Text()))}
	case ast.KindBigIntLiteral:
		text := strings.ReplaceAll(strings.TrimSuffix(node.Text(), "n"), "_", "")
		integer, ok := new(big.Int).SetString(text, 0)
		if !ok {
			integer, _ = new(big.Int).SetString(text, 10)
		}
		if sign < 0 {
			integer.Neg(integer)
		}
		return expressionBound{integer: integer}
	case ast.KindTrueKeyword:
		return expressionBound{number: 1}
	case ast.KindFalseKeyword, ast.KindNullKeyword:
		return expressionBound{number: 0}
	case ast.KindRegularExpressionLiteral:
		return expressionBound{text: node.Text(), stringValue: true}
	}
	return expressionBound{number: math.NaN()}
}

func expressionBoundsOrdered(left, right *ast.Node) bool {
	leftValue, rightValue := expressionBoundValue(left), expressionBoundValue(right)
	if leftValue.stringValue && rightValue.stringValue {
		return slices.Compare(utf16.Encode([]rune(leftValue.text)), utf16.Encode([]rune(rightValue.text))) <= 0
	}
	toNumber := func(value expressionBound) (float64, *big.Int, bool) {
		if value.stringValue {
			value.number = float64(jsnum.FromString(strings.TrimSpace(value.text)))
		}
		return value.number, value.integer, !math.IsNaN(value.number)
	}
	leftNumber, leftInteger, leftOK := toNumber(leftValue)
	rightNumber, rightInteger, rightOK := toNumber(rightValue)
	if !leftOK || !rightOK {
		return false
	}
	if leftInteger == nil && rightInteger == nil {
		return leftNumber <= rightNumber
	}
	if leftInteger != nil && rightInteger != nil {
		return leftInteger.Cmp(rightInteger) <= 0
	}
	if math.IsInf(leftNumber, 0) || math.IsInf(rightNumber, 0) {
		return leftNumber < rightNumber
	}
	leftRat, rightRat := new(big.Rat), new(big.Rat)
	if leftInteger != nil {
		leftRat.SetInt(leftInteger)
	} else {
		leftRat.SetFloat64(leftNumber)
	}
	if rightInteger != nil {
		rightRat.SetInt(rightInteger)
	} else {
		rightRat.SetFloat64(rightNumber)
	}
	return leftRat.Cmp(rightRat) <= 0
}

func expressionRangeOperator(node *ast.Node) bool {
	if node.Kind != ast.KindBinaryExpression {
		return false
	}
	kind := node.AsBinaryExpression().OperatorToken.Kind
	return kind == ast.KindLessThanToken || kind == ast.KindLessThanEqualsToken
}

func newYoda(context Context) Rule { return &yodaRule{context: context} }
