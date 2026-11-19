package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/ls/change"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type operatorAssignmentRule struct {
	context Context
}

func newOperatorAssignment(context Context) Rule {
	rule := &operatorAssignmentRule{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindBinaryExpression},
	}
}

func (rule *operatorAssignmentRule) OnEnterNode(node *ast.Node) bool {
	rule.assignment(node)

	return true
}

func (rule *operatorAssignmentRule) assignment(node *ast.Node) {
	if node.Kind != ast.KindBinaryExpression {
		return
	}
	binary := node.AsBinaryExpression()
	operator := binary.OperatorToken.Kind
	if rule.option(0) == "never" {
		if !ast.IsAssignmentOperator(operator) || operator == ast.KindEqualsToken || operator == ast.KindAmpersandAmpersandEqualsToken || operator == ast.KindBarBarEqualsToken || operator == ast.KindQuestionQuestionEqualsToken {
			return
		}
		diagnostic := rule.context.Report(rule.context.Range(node), diagnostics.Unexpected_operator_assignment_0_shorthand, scanner.TokenToString(operator))
		if !expressionAssignable(binary.Left) || rule.comments(rule.Start(node), rule.Start(binary.OperatorToken)) {
			return
		}
		var arithmetic ast.Kind
		for candidate := ast.KindFirstBinaryOperator; candidate <= ast.KindLastBinaryOperator; candidate++ {
			if expressionArithmetic(candidate) == operator {
				arithmetic = candidate
				break
			}
		}
		if arithmetic == ast.KindUnknown {
			return
		}
		rule.replace(diagnostic, node, func(tracker *change.Tracker) *ast.Node {
			right := tracker.DeepCloneReparse(binary.Right)
			if ast.GetExpressionPrecedence(ast.SkipParentheses(right)) <= ast.GetOperatorPrecedence(ast.KindBinaryExpression, arithmetic, ast.OperatorPrecedenceFlagsNone) && right.Kind != ast.KindParenthesizedExpression {
				right = tracker.NewParenthesizedExpression(right)
			}
			operation := tracker.NewBinaryExpression(nil, tracker.DeepCloneReparse(binary.Left), nil, tracker.NewToken(arithmetic), right)
			return tracker.NewBinaryExpression(nil, binary.Left, nil, tracker.NewToken(ast.KindEqualsToken), operation)
		})
		return
	}
	right := ast.SkipParentheses(binary.Right)
	if operator != ast.KindEqualsToken || right.Kind != ast.KindBinaryExpression {
		return
	}
	expression := right.AsBinaryExpression()
	arithmetic := expression.OperatorToken.Kind
	replacement := expressionArithmetic(arithmetic)
	if replacement == ast.KindUnknown {
		return
	}
	leftMatch := helpers.ExpressionSame(binary.Left, expression.Left, true)
	commutative := arithmetic == ast.KindAsteriskToken || arithmetic == ast.KindAmpersandToken || arithmetic == ast.KindCaretToken || arithmetic == ast.KindBarToken
	if !leftMatch && !(commutative && helpers.ExpressionSame(binary.Left, expression.Right, true)) {
		return
	}
	diagnostic := rule.context.Report(rule.context.Range(node), diagnostics.Assignment_can_be_replaced_with_operator_assignment_0, scanner.TokenToString(replacement))
	if !leftMatch || !expressionAssignable(binary.Left) || !expressionAssignable(expression.Left) || rule.comments(binary.OperatorToken.End(), rule.Start(expression.OperatorToken)) {
		return
	}
	rule.replace(diagnostic, node, func(tracker *change.Tracker) *ast.Node {
		return tracker.NewBinaryExpression(nil, binary.Left, nil, tracker.NewToken(replacement), expression.Right)
	})
}

func (rule *operatorAssignmentRule) comments(start, end int) bool {
	lexer := scanner.NewScanner()
	lexer.SetText(rule.context.File.Text()[start:end])
	lexer.SetSkipTrivia(false)
	for kind := lexer.Scan(); kind != ast.KindEndOfFile; kind = lexer.Scan() {
		if kind == ast.KindSingleLineCommentTrivia || kind == ast.KindMultiLineCommentTrivia {
			return true
		}
	}
	return false
}

func (rule *operatorAssignmentRule) option(index int) any {
	if index < len(rule.context.Options) {
		return rule.context.Options[index]
	}
	return nil
}

func (rule *operatorAssignmentRule) replace(diagnostic *ast.Diagnostic, old *ast.Node, build func(*change.Tracker) *ast.Node) {
	if rule.context.NewTracker == nil {
		return
	}
	tracker := rule.context.NewTracker()
	tracker.ReplaceNodePreservingComments(rule.context.File, old, build(tracker))
	diagnostic.SetCodeFixes(codefix.CreateCodeFixAction("operator-assignment", tracker.GetTextChanges(), ast.NewCompilerDiagnostic(diagnostics.Fix_0, "operator-assignment"), "operator-assignment", ast.NewCompilerDiagnostic(diagnostics.Fix_all_0, "operator-assignment")))
}

func (rule *operatorAssignmentRule) Start(node *ast.Node) int {
	return scanner.GetTokenPosOfNode(node, rule.context.File, false)
}

func expressionArithmetic(kind ast.Kind) ast.Kind {
	switch kind {
	case ast.KindPlusToken:
		return ast.KindPlusEqualsToken
	case ast.KindMinusToken:
		return ast.KindMinusEqualsToken
	case ast.KindAsteriskToken:
		return ast.KindAsteriskEqualsToken
	case ast.KindSlashToken:
		return ast.KindSlashEqualsToken
	case ast.KindPercentToken:
		return ast.KindPercentEqualsToken
	case ast.KindAsteriskAsteriskToken:
		return ast.KindAsteriskAsteriskEqualsToken
	case ast.KindLessThanLessThanToken:
		return ast.KindLessThanLessThanEqualsToken
	case ast.KindGreaterThanGreaterThanToken:
		return ast.KindGreaterThanGreaterThanEqualsToken
	case ast.KindGreaterThanGreaterThanGreaterThanToken:
		return ast.KindGreaterThanGreaterThanGreaterThanEqualsToken
	case ast.KindAmpersandToken:
		return ast.KindAmpersandEqualsToken
	case ast.KindCaretToken:
		return ast.KindCaretEqualsToken
	case ast.KindBarToken:
		return ast.KindBarEqualsToken
	}
	return ast.KindUnknown
}

func expressionAssignable(node *ast.Node) bool {
	node = ast.SkipParentheses(node)
	if node.Kind == ast.KindIdentifier {
		return true
	}
	if !ast.IsAccessExpression(node) || ast.IsOptionalChain(node) {
		return false
	}
	object := ast.SkipParentheses(node.Expression())
	if object.Kind != ast.KindIdentifier && object.Kind != ast.KindThisKeyword {
		return false
	}
	if node.Kind == ast.KindPropertyAccessExpression {
		return true
	}
	property := ast.SkipParentheses(node.AsElementAccessExpression().ArgumentExpression)
	return helpers.ExpressionLiteral(property) && property.Kind != ast.KindNoSubstitutionTemplateLiteral
}
