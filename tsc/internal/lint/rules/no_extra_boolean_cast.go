package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/ls/change"
)

type noExtraBooleanCast struct {
	context Context
}

func newNoExtraBooleanCast(context Context) Rule {
	rule := &noExtraBooleanCast{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindPrefixUnaryExpression, ast.KindCallExpression},
	}
}

func (rule *noExtraBooleanCast) OnEnterNode(node *ast.Node) bool {
	rule.booleanCast(node)

	return true
}

func (rule *noExtraBooleanCast) Options() map[string]any {
	if len(rule.context.Options) > 0 {
		options, _ := rule.context.Options[0].(map[string]any)
		return options
	}
	return nil
}

func (rule *noExtraBooleanCast) Boolean(name string) bool {
	value, _ := rule.Options()[name].(bool)
	return value
}

func (rule *noExtraBooleanCast) booleanCall(node *ast.Node) bool {
	if node.Kind != ast.KindCallExpression && node.Kind != ast.KindNewExpression {
		return false
	}
	callee := ast.SkipParentheses(node.Expression())
	return callee.Kind == ast.KindIdentifier && callee.Text() == "Boolean" && helpers.StatementBuiltin(rule.context, callee, true)
}

func (rule *noExtraBooleanCast) booleanContext(node *ast.Node) bool {
	outer, parent := helpers.OuterParenthesizedNodeAndParent(node)
	if parent == nil {
		return false
	}
	if rule.booleanCall(parent) {
		arguments := parent.Arguments()
		return len(arguments) > 0 && arguments[0] == outer
	}
	switch parent.Kind {
	case ast.KindIfStatement, ast.KindWhileStatement, ast.KindDoStatement:
		return parent.Expression() == outer
	case ast.KindForStatement:
		return parent.AsForStatement().Condition == outer
	case ast.KindConditionalExpression:
		conditional := parent.AsConditionalExpression()
		return conditional.Condition == outer || rule.Boolean("enforceForInnerExpressions") && rule.booleanContext(parent)
	case ast.KindPrefixUnaryExpression:
		return parent.AsPrefixUnaryExpression().Operator == ast.KindExclamationToken
	case ast.KindBinaryExpression:
		binary := parent.AsBinaryExpression()
		inner := rule.Boolean("enforceForInnerExpressions")
		logical := binary.OperatorToken.Kind == ast.KindAmpersandAmpersandToken || binary.OperatorToken.Kind == ast.KindBarBarToken
		if (inner || rule.Boolean("enforceForLogicalOperands")) && logical || inner && (binary.OperatorToken.Kind == ast.KindQuestionQuestionToken || binary.OperatorToken.Kind == ast.KindCommaToken) && binary.Right == outer {
			return rule.booleanContext(parent)
		}
	}
	return false
}

func (rule *noExtraBooleanCast) booleanCast(node *ast.Node) {
	var target, replacement *ast.Node
	var diagnostic *ast.Diagnostic
	if node.Kind == ast.KindPrefixUnaryExpression && node.AsPrefixUnaryExpression().Operator == ast.KindExclamationToken {
		_, parent := helpers.OuterParenthesizedNodeAndParent(node)
		if parent != nil && parent.Kind == ast.KindPrefixUnaryExpression && parent.AsPrefixUnaryExpression().Operator == ast.KindExclamationToken && rule.booleanContext(parent) {
			target, replacement = parent, node.AsPrefixUnaryExpression().Operand
			diagnostic = rule.context.Report(rule.context.Range(target), diagnostics.Redundant_double_negation)
		}
	} else if node.Kind == ast.KindCallExpression && rule.booleanCall(node) && rule.booleanContext(node) {
		target = node
		diagnostic = rule.context.Report(rule.context.Range(node), diagnostics.Redundant_Boolean_call)
		arguments := node.AsCallExpression().Arguments.Nodes
		if len(arguments) > 1 || len(arguments) == 1 && arguments[0].Kind == ast.KindSpreadElement {
			return
		}
		if len(arguments) == 1 {
			replacement = arguments[0]
		}
	}
	if diagnostic == nil || rule.context.NewTracker == nil {
		return
	}
	tracker := rule.context.NewTracker()
	if replacement == nil {
		_, parent := helpers.OuterParenthesizedNodeAndParent(target)
		if parent != nil && parent.Kind == ast.KindPrefixUnaryExpression && parent.AsPrefixUnaryExpression().Operator == ast.KindExclamationToken {
			target, replacement = parent, tracker.NewKeywordExpression(ast.KindTrueKeyword)
		} else {
			replacement = tracker.NewKeywordExpression(ast.KindFalseKeyword)
		}
	}
	if helpers.ContainsCommentTrivia(helpers.SourceNodeText(rule.context, target)) {
		return
	}
	tracker.ReplaceNodePreservingComments(rule.context.File, target, tracker.NewParenthesizedExpression(replacement))
	rule.fix(diagnostic, tracker, ast.NewCompilerDiagnostic(diagnostics.Remove_redundant_boolean_cast))
}

func (rule *noExtraBooleanCast) fix(diagnostic *ast.Diagnostic, tracker *change.Tracker, description *ast.Diagnostic) {
	diagnostic.SetCodeFixes(codefix.CreateCodeFixAction("no-extra-boolean-cast", tracker.GetTextChanges(), description, "no-extra-boolean-cast", description))
}
