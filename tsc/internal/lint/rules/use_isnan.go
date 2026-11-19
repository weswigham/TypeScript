package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/ls/change"
)

type useIsnanRule struct {
	context     Context
	suggestions map[*ast.Diagnostic][]*codefix.CodeFixAction
}

func newUseIsnan(context Context) Rule {
	rule := &useIsnanRule{context: context}

	return Rule{
		Enter:          rule.OnEnterNode,
		EnterKinds:     []ast.Kind{ast.KindBinaryExpression, ast.KindCallExpression, ast.KindSwitchStatement},
		GetSuggestions: rule.Suggestions,
	}
}

func (rule *useIsnanRule) OnEnterNode(node *ast.Node) bool {
	rule.isnan(node)

	return true
}

func (rule *useIsnanRule) Suggestions() map[*ast.Diagnostic][]*codefix.CodeFixAction {
	return rule.suggestions
}

func (rule *useIsnanRule) boolean(index int, name string, fallback bool) bool {
	object, _ := rule.option(index).(map[string]any)
	if value, ok := object[name].(bool); ok {
		return value
	}
	return fallback
}

func (rule *useIsnanRule) isnan(node *ast.Node) {
	switch node.Kind {
	case ast.KindBinaryExpression:
		binary := node.AsBinaryExpression()
		kind := binary.OperatorToken.Kind
		if !helpers.ExpressionComparison(kind) || !rule.nan(binary.Left) && !rule.nan(binary.Right) {
			return
		}
		diagnostic := rule.context.Report(rule.context.Range(node), diagnostics.Use_the_isNaN_function_to_compare_with_NaN)
		nan, value := binary.Right, binary.Left
		if rule.nan(binary.Left) {
			nan, value = binary.Left, binary.Right
		}
		if expressionSequence(nan) || kind != ast.KindEqualsEqualsToken && kind != ast.KindEqualsEqualsEqualsToken && kind != ast.KindExclamationEqualsToken && kind != ast.KindExclamationEqualsEqualsToken {
			return
		}
		build := func(cast bool) func(*change.Tracker) *ast.Node {
			return func(tracker *change.Tracker) *ast.Node {
				argument := tracker.DeepCloneReparse(value)
				if cast {
					argument = expressionCall(tracker, tracker.NewIdentifier("Number"), argument)
				}
				result := expressionCall(tracker, expressionNumberIsNaN(tracker), argument)
				if kind == ast.KindExclamationEqualsToken || kind == ast.KindExclamationEqualsEqualsToken {
					result = tracker.NewPrefixUnaryExpression(ast.KindExclamationToken, result)
				}
				return result
			}
		}
		rule.suggest(diagnostic, node, diagnostics.Replace_with_Number_isNaN, build(false))
		if kind == ast.KindEqualsEqualsToken || kind == ast.KindExclamationEqualsToken {
			rule.suggest(diagnostic, node, diagnostics.Replace_with_Number_isNaN_and_cast_to_a_Number, build(true))
		}
	case ast.KindSwitchStatement:
		if !rule.boolean(0, "enforceForSwitchCase", true) {
			return
		}
		if rule.nan(node.Expression()) {
			rule.context.Report(rule.context.Range(node), diagnostics.X_switch_NaN_can_never_match_a_case_clause_Use_Number_isNaN_instead_of_the_switch)
		}
		for _, clause := range node.AsSwitchStatement().CaseBlock.AsCaseBlock().Clauses.Nodes {
			if clause.Kind == ast.KindCaseClause && rule.nan(clause.Expression()) {
				rule.context.Report(rule.context.Range(clause), diagnostics.X_case_NaN_can_never_match_Use_Number_isNaN_before_the_switch)
			}
		}
	case ast.KindCallExpression:
		if !rule.boolean(0, "enforceForIndexOf", false) {
			return
		}
		call := node.AsCallExpression()
		callee := ast.SkipParentheses(call.Expression)
		if !ast.IsAccessExpression(callee) || call.Arguments == nil || len(call.Arguments.Nodes) == 0 || len(call.Arguments.Nodes) > 2 || !rule.nan(call.Arguments.Nodes[0]) {
			return
		}
		method := helpers.StatementPropertyName(callee)
		if method != "indexOf" && method != "lastIndexOf" {
			return
		}
		diagnostic := rule.context.Report(rule.context.Range(node), diagnostics.Array_prototype_method_0_cannot_find_NaN, method)
		if len(call.Arguments.Nodes) != 1 || expressionSequence(call.Arguments.Nodes[0]) {
			return
		}
		replacement := "findIndex"
		if method == "lastIndexOf" {
			replacement = "findLastIndex"
		}
		rule.suggest(diagnostic, node, diagnostics.Replace_with_Array_prototype_0, func(tracker *change.Tracker) *ast.Node {
			var member *ast.Node
			if callee.Kind == ast.KindPropertyAccessExpression {
				member = tracker.NewPropertyAccessExpression(callee.Expression(), callee.AsPropertyAccessExpression().QuestionDotToken, tracker.NewIdentifier(replacement), callee.Flags)
			} else {
				member = tracker.NewElementAccessExpression(callee.Expression(), callee.AsElementAccessExpression().QuestionDotToken, tracker.NewStringLiteral(replacement, ast.TokenFlagsNone), callee.Flags)
			}
			if call.Expression.Kind == ast.KindParenthesizedExpression {
				member = tracker.NewParenthesizedExpression(member)
			}
			return tracker.NewCallExpression(member, call.QuestionDotToken, call.TypeArguments, tracker.NewNodeList([]*ast.Node{expressionNumberIsNaN(tracker)}), node.Flags)
		}, replacement)
	}
}

func (rule *useIsnanRule) nan(node *ast.Node) bool {
	if node == nil {
		return false
	}
	node = ast.SkipParentheses(node)
	for expressionSequence(node) {
		node = ast.SkipParentheses(node.AsBinaryExpression().Right)
	}
	if node.Kind == ast.KindIdentifier && node.Text() == "NaN" {
		return expressionGlobalReference(rule.context, node)
	}
	if ast.IsAccessExpression(node) && helpers.StatementPropertyName(node) == "NaN" {
		object := ast.SkipParentheses(node.Expression())
		return object.Kind == ast.KindIdentifier && object.Text() == "Number" && expressionGlobalReference(rule.context, object)
	}
	return false
}

func (rule *useIsnanRule) option(index int) any {
	if index < len(rule.context.Options) {
		return rule.context.Options[index]
	}
	return nil
}

func (rule *useIsnanRule) suggest(diagnostic *ast.Diagnostic, old *ast.Node, message *diagnostics.Message, build func(*change.Tracker) *ast.Node, args ...any) {
	if rule.context.NewTracker == nil {
		return
	}
	tracker := rule.context.NewTracker()
	tracker.ReplaceNodePreservingComments(rule.context.File, old, build(tracker))
	if rule.suggestions == nil {
		rule.suggestions = make(map[*ast.Diagnostic][]*codefix.CodeFixAction)
	}
	rule.suggestions[diagnostic] = append(rule.suggestions[diagnostic], codefix.CreateCodeFixAction("use-isnan", tracker.GetTextChanges(), ast.NewCompilerDiagnostic(message, args...), "", nil))
}

func expressionSequence(node *ast.Node) bool {
	node = ast.SkipParentheses(node)
	return node.Kind == ast.KindBinaryExpression && node.AsBinaryExpression().OperatorToken.Kind == ast.KindCommaToken
}

func expressionCall(tracker *change.Tracker, callee *ast.Node, argument *ast.Node) *ast.Node {
	return tracker.NewCallExpression(callee, nil, nil, tracker.NewNodeList([]*ast.Node{argument}), ast.NodeFlagsNone)
}

func expressionNumberIsNaN(tracker *change.Tracker) *ast.Node {
	return tracker.NewPropertyAccessExpression(tracker.NewIdentifier("Number"), nil, tracker.NewIdentifier("isNaN"), ast.NodeFlagsNone)
}
