package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/ls/change"
)

type noUnneededTernaryRule struct {
	context Context
}

func newNoUnneededTernary(context Context) Rule {
	rule := &noUnneededTernaryRule{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindConditionalExpression},
	}
}

func (rule *noUnneededTernaryRule) OnEnterNode(node *ast.Node) bool {
	rule.ternary(node)

	return true
}

func (rule *noUnneededTernaryRule) boolean(index int, name string, fallback bool) bool {
	object, _ := rule.option(index).(map[string]any)
	if value, ok := object[name].(bool); ok {
		return value
	}
	return fallback
}

func (rule *noUnneededTernaryRule) option(index int) any {
	if index < len(rule.context.Options) {
		return rule.context.Options[index]
	}
	return nil
}

func (rule *noUnneededTernaryRule) replace(diagnostic *ast.Diagnostic, old *ast.Node, build func(*change.Tracker) *ast.Node) {
	if rule.context.NewTracker == nil {
		return
	}
	tracker := rule.context.NewTracker()
	tracker.ReplaceNodePreservingComments(rule.context.File, old, build(tracker))
	diagnostic.SetCodeFixes(codefix.CreateCodeFixAction("no-unneeded-ternary", tracker.GetTextChanges(), ast.NewCompilerDiagnostic(diagnostics.Fix_0, "no-unneeded-ternary"), "no-unneeded-ternary", ast.NewCompilerDiagnostic(diagnostics.Fix_all_0, "no-unneeded-ternary")))
}

func (rule *noUnneededTernaryRule) ternary(node *ast.Node) {
	if node.Kind != ast.KindConditionalExpression {
		return
	}
	expression := node.AsConditionalExpression()
	condition, yes, no := ast.SkipParentheses(expression.Condition), ast.SkipParentheses(expression.WhenTrue), ast.SkipParentheses(expression.WhenFalse)
	if expressionBoolean(yes) && expressionBoolean(no) {
		diagnostic := rule.context.Report(rule.context.Range(node), diagnostics.Unnecessary_use_of_boolean_literals_in_conditional_expression)
		if yes.Kind == no.Kind {
			if condition.Kind == ast.KindIdentifier {
				rule.replace(diagnostic, node, func(tracker *change.Tracker) *ast.Node { return tracker.NewToken(yes.Kind) })
			}
			return
		}
		rule.replace(diagnostic, node, func(tracker *change.Tracker) *ast.Node {
			if no.Kind == ast.KindTrueKeyword {
				return expressionInvert(tracker, condition)
			}
			if condition.Kind == ast.KindPrefixUnaryExpression && condition.AsPrefixUnaryExpression().Operator == ast.KindExclamationToken {
				return tracker.DeepCloneReparse(expression.Condition)
			}
			if condition.Kind == ast.KindBinaryExpression {
				kind := condition.AsBinaryExpression().OperatorToken.Kind
				if helpers.ExpressionComparison(kind) || kind == ast.KindInKeyword || kind == ast.KindInstanceOfKeyword {
					return tracker.DeepCloneReparse(expression.Condition)
				}
			}
			return tracker.NewPrefixUnaryExpression(ast.KindExclamationToken, expressionInvert(tracker, condition))
		})
	} else if !rule.boolean(0, "defaultAssignment", true) && condition.Kind == ast.KindIdentifier && yes.Kind == ast.KindIdentifier && condition.Text() == yes.Text() {
		diagnostic := rule.context.Report(rule.context.Range(node), diagnostics.Unnecessary_use_of_conditional_expression_for_default_assignment)
		rule.replace(diagnostic, node, func(tracker *change.Tracker) *ast.Node {
			alternate := tracker.DeepCloneReparse(expression.WhenFalse)
			if no.Kind == ast.KindBinaryExpression && no.AsBinaryExpression().OperatorToken.Kind == ast.KindQuestionQuestionToken {
				alternate = tracker.NewParenthesizedExpression(alternate)
			}
			return tracker.NewBinaryExpression(nil, expression.Condition, nil, tracker.NewToken(ast.KindBarBarToken), alternate)
		})
	}
}

func expressionBoolean(node *ast.Node) bool {
	return node.Kind == ast.KindTrueKeyword || node.Kind == ast.KindFalseKeyword
}

func expressionInvert(tracker *change.Tracker, node *ast.Node) *ast.Node {
	node = ast.SkipParentheses(node)
	if node.Kind == ast.KindBinaryExpression {
		binary := node.AsBinaryExpression()
		inverse := map[ast.Kind]ast.Kind{
			ast.KindEqualsEqualsToken:            ast.KindExclamationEqualsToken,
			ast.KindEqualsEqualsEqualsToken:      ast.KindExclamationEqualsEqualsToken,
			ast.KindExclamationEqualsToken:       ast.KindEqualsEqualsToken,
			ast.KindExclamationEqualsEqualsToken: ast.KindEqualsEqualsEqualsToken,
		}[binary.OperatorToken.Kind]
		if inverse != ast.KindUnknown {
			return tracker.NewBinaryExpression(nil, binary.Left, nil, tracker.NewToken(inverse), binary.Right)
		}
	}
	return tracker.NewPrefixUnaryExpression(ast.KindExclamationToken, tracker.DeepCloneReparse(node))
}
