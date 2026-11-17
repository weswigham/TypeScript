package rules

import (
	"slices"
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/stringutil"
)

type noSelfAssign struct {
	context Context
}

func (rule *noSelfAssign) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindBinaryExpression && !helpers.IsDestructuringAssignmentPattern(node) {
		expression := node.AsBinaryExpression()
		switch expression.OperatorToken.Kind {
		case ast.KindEqualsToken, ast.KindAmpersandAmpersandEqualsToken, ast.KindBarBarEqualsToken, ast.KindQuestionQuestionEqualsToken:
			rule.selfAssignment(expression.Left, expression.Right)
		}
	}
	return true
}

func (rule *noSelfAssign) OnExitNode(node *ast.Node) {}

func (rule *noSelfAssign) selfAssignment(left, right *ast.Node) {
	if left == nil || right == nil {
		return
	}
	left, right = ast.SkipParentheses(left), ast.SkipParentheses(right)
	if left.Kind == ast.KindIdentifier && right.Kind == ast.KindIdentifier && left.Text() == right.Text() {
		rule.reportAssignment(right)
	} else if left.Kind == ast.KindArrayLiteralExpression && right.Kind == ast.KindArrayLiteralExpression {
		leftElements, rightElements := left.AsArrayLiteralExpression().Elements.Nodes, right.AsArrayLiteralExpression().Elements.Nodes
		for index := range min(len(leftElements), len(rightElements)) {
			leftElement, rightElement := leftElements[index], rightElements[index]
			if leftElement.Kind == ast.KindSpreadElement && index < len(rightElements)-1 {
				break
			}
			rule.selfAssignment(leftElement, rightElement)
			if rightElement.Kind == ast.KindSpreadElement {
				break
			}
		}
	} else if left.Kind == ast.KindSpreadElement && right.Kind == ast.KindSpreadElement {
		rule.selfAssignment(left.Expression(), right.Expression())
	} else if left.Kind == ast.KindObjectLiteralExpression && right.Kind == ast.KindObjectLiteralExpression {
		properties := right.AsObjectLiteralExpression().Properties.Nodes
		start := 0
		for index, property := range slices.Backward(properties) {
			if property.Kind == ast.KindSpreadAssignment {
				start = index + 1
				break
			}
		}
		for _, leftProperty := range left.AsObjectLiteralExpression().Properties.Nodes {
			for _, rightProperty := range properties[start:] {
				rule.selfAssignment(leftProperty, rightProperty)
			}
		}
	} else if noSelfAssignDataProperty(left) && noSelfAssignDataProperty(right) {
		leftName, leftStatic := helpers.StaticMemberNameText(left)
		rightName, rightStatic := helpers.StaticMemberNameText(right)
		if leftStatic && rightStatic && leftName == rightName {
			rule.selfAssignment(noSelfAssignPropertyValue(left), noSelfAssignPropertyValue(right))
		}
	} else if helpers.BooleanRuleOption(rule.context, "props", true) && ast.IsAccessExpression(left) && ast.IsAccessExpression(right) && helpers.SameStaticReference(left, right) {
		rule.reportAssignment(right)
	}
}

func noSelfAssignDataProperty(node *ast.Node) bool {
	return node.Kind == ast.KindPropertyAssignment || node.Kind == ast.KindShorthandPropertyAssignment
}

func noSelfAssignPropertyValue(node *ast.Node) *ast.Node {
	if node.Kind == ast.KindPropertyAssignment {
		return node.Initializer()
	}
	if node.AsShorthandPropertyAssignment().ObjectAssignmentInitializer != nil {
		return nil
	}
	return node.Name()
}

func (rule *noSelfAssign) reportAssignment(node *ast.Node) {
	text := rule.context.File.Text()[helpers.RuleTokenStart(rule.context, node):node.End()]
	text = strings.Map(func(character rune) rune {
		if stringutil.IsWhiteSpaceLike(character) && character != 0x0085 && character != 0x200b {
			return -1
		}
		return character
	}, text)
	rule.context.Report(rule.context.Range(node), diagnostics.X_0_is_assigned_to_itself, text)
}

func newNoSelfAssign(context Context) Rule { return &noSelfAssign{context: context} }
