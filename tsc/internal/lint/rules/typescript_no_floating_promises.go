package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/checker"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/ls/change"
)

type typescriptNoFloatingPromisesRule struct {
	context     Context
	suggestions map[*ast.Diagnostic][]*codefix.CodeFixAction
}

func (rule *typescriptNoFloatingPromisesRule) floatingPromise(node *ast.Node, value *checker.Type) bool {
	if helpers.PromiseAllowed(rule.context, node, value, "allowForKnownSafePromises", false) {
		return false
	}
	for _, part := range helpers.PromiseParts(rule.context.GetChecker().GetApparentType(value)) {
		if helpers.PromiseBuiltin(rule.context, part, "Promise") {
			return true
		}
	}
	return helpers.PromiseBoolean(rule.context, "checkThenables", false) && helpers.PromiseThenable(rule.context, node, value, true)
}

func (rule *typescriptNoFloatingPromisesRule) unhandled(node *ast.Node) (unhandled, nonFunction, array bool) {
	node = ast.SkipParentheses(node)
	typeChecker := rule.context.GetChecker()
	if node.Kind == ast.KindBinaryExpression {
		binary := node.AsBinaryExpression()
		if ast.IsAssignmentOperator(binary.OperatorToken.Kind) {
			return false, false, false
		}
		if binary.OperatorToken.Kind == ast.KindCommaToken {
			if unhandled, nonFunction, array = rule.unhandled(binary.Left); unhandled {
				return unhandled, nonFunction, array
			}
			return rule.unhandled(binary.Right)
		}
	}
	if node.Kind == ast.KindVoidExpression && !helpers.PromiseBoolean(rule.context, "ignoreVoid", true) {
		return rule.unhandled(node.Expression())
	}
	value := helpers.PromiseConstrained(rule.context, node)
	for _, part := range helpers.PromiseParts(typeChecker.GetApparentType(value)) {
		if !typeChecker.IsArrayType(part) && !checker.IsTupleType(part) {
			continue
		}
		for _, element := range typeChecker.GetTypeArguments(part) {
			if rule.floatingPromise(node, element) {
				return true, false, true
			}
		}
	}
	if node.Kind == ast.KindAwaitExpression || !rule.floatingPromise(node, value) {
		return false, false, false
	}
	if node.Kind == ast.KindCallExpression {
		object, method := helpers.PromiseMember(rule.context, node.Expression())
		if object != nil {
			arguments := node.Arguments()
			index := 0
			if method == "then" {
				index = 1
			}
			if method == "then" || method == "catch" {
				if len(arguments) <= index {
					return true, false, false
				}
				for _, argument := range arguments[:index+1] {
					if argument.Kind == ast.KindSpreadElement {
						return true, false, false
					}
				}
				if helpers.PromiseCallable(rule.context, typeChecker.GetTypeAtLocation(arguments[index])) {
					return false, false, false
				}
				return true, true, false
			}
			if method == "finally" {
				return rule.unhandled(object)
			}
		}
		return true, false, false
	}
	if node.Kind == ast.KindConditionalExpression {
		conditional := node.AsConditionalExpression()
		if unhandled, nonFunction, array = rule.unhandled(conditional.WhenFalse); unhandled {
			return unhandled, nonFunction, array
		}
		return rule.unhandled(conditional.WhenTrue)
	}
	if node.Kind == ast.KindBinaryExpression {
		binary := node.AsBinaryExpression()
		switch binary.OperatorToken.Kind {
		case ast.KindAmpersandAmpersandToken, ast.KindBarBarToken, ast.KindQuestionQuestionToken:
			if unhandled, nonFunction, array = rule.unhandled(binary.Left); unhandled {
				return unhandled, nonFunction, array
			}
			return rule.unhandled(binary.Right)
		}
	}
	return true, false, false
}

func (rule *typescriptNoFloatingPromisesRule) checkFloating(node *ast.Node) {
	var expression *ast.Node
	if node.Kind == ast.KindExpressionStatement {
		expression = node.Expression()
	}
	if node.Kind == ast.KindArrowFunction && node.Body().Kind == ast.KindVoidExpression {
		node, expression = node.Body(), node.Body()
	}
	if expression == nil {
		return
	}
	unwrapped := ast.SkipParentheses(expression)
	if helpers.PromiseBoolean(rule.context, "ignoreIIFE", false) && unwrapped.Kind == ast.KindCallExpression {
		callee := ast.SkipParentheses(unwrapped.Expression())
		if callee.Kind == ast.KindArrowFunction || callee.Kind == ast.KindFunctionExpression {
			return
		}
	}
	if unwrapped.Kind == ast.KindCallExpression && helpers.PromiseAllowed(rule.context, unwrapped.Expression(), rule.context.GetChecker().GetTypeAtLocation(unwrapped.Expression()), "allowForKnownSafeCalls", true) {
		return
	}
	unhandled, nonFunction, array := rule.unhandled(expression)
	if !unhandled {
		return
	}
	ignoreVoid := helpers.PromiseBoolean(rule.context, "ignoreVoid", true)
	if array {
		message := diagnostics.An_array_of_Promises_may_be_unintentional_Consider_handling_the_promises_fulfillment_or_rejection_with_Promise_all_or_similar
		if ignoreVoid {
			message = diagnostics.An_array_of_Promises_may_be_unintentional_Consider_handling_the_promises_fulfillment_or_rejection_with_Promise_all_or_similar_or_explicitly_marking_the_expression_as_ignored_with_the_void_operator
		}
		rule.context.Report(rule.context.Range(node), message)
		return
	}
	message := diagnostics.Promises_must_be_awaited_end_with_a_call_to_catch_or_end_with_a_call_to_then_with_a_rejection_handler
	if ignoreVoid {
		message = diagnostics.Promises_must_be_awaited_end_with_a_call_to_catch_end_with_a_call_to_then_with_a_rejection_handler_or_be_explicitly_marked_as_ignored_with_the_void_operator
		if nonFunction {
			message = diagnostics.Promises_must_be_awaited_end_with_a_call_to_catch_end_with_a_call_to_then_with_a_rejection_handler_or_be_explicitly_marked_as_ignored_with_the_void_operator_A_rejection_handler_that_is_not_a_function_will_be_ignored
		}
	} else if nonFunction {
		message = diagnostics.Promises_must_be_awaited_end_with_a_call_to_catch_or_end_with_a_call_to_then_with_a_rejection_handler_A_rejection_handler_that_is_not_a_function_will_be_ignored
	}
	diagnostic := rule.context.Report(rule.context.Range(node), message)
	if ignoreVoid {
		rule.action(diagnostic, ast.NewCompilerDiagnostic(diagnostics.Add_void_operator_to_ignore), false, func(tracker *change.Tracker) {
			helpers.PromiseInsertOperator(rule.context, tracker, expression, "void")
		})
	}
	rule.action(diagnostic, ast.NewCompilerDiagnostic(diagnostics.Add_await_operator), false, func(tracker *change.Tracker) {
		if unwrapped.Kind == ast.KindVoidExpression {
			helpers.PromiseReplace(rule.context, tracker, helpers.PromiseStart(rule.context, unwrapped), helpers.PromiseStart(rule.context, unwrapped)+4, "await")
		} else {
			helpers.PromiseInsertOperator(rule.context, tracker, expression, "await")
		}
	})
}

func (rule *typescriptNoFloatingPromisesRule) action(diagnostic *ast.Diagnostic, description *ast.Diagnostic, automatic bool, edit func(*change.Tracker)) {
	if rule.context.NewTracker == nil {
		return
	}
	tracker := rule.context.NewTracker()
	edit(tracker)
	action := codefix.CreateCodeFixAction("@typescript-eslint/"+"no-floating-promises", tracker.GetTextChanges(), description, "", nil)
	if automatic {
		diagnostic.SetCodeFixes(action)
		return
	}
	if rule.suggestions == nil {
		rule.suggestions = make(map[*ast.Diagnostic][]*codefix.CodeFixAction)
	}
	rule.suggestions[diagnostic] = append(rule.suggestions[diagnostic], action)
}

func (rule *typescriptNoFloatingPromisesRule) Suggestions() map[*ast.Diagnostic][]*codefix.CodeFixAction {
	return rule.suggestions
}

func (rule *typescriptNoFloatingPromisesRule) OnEnterNode(node *ast.Node) bool {
	rule.checkFloating(node)
	return true
}

func (rule *typescriptNoFloatingPromisesRule) OnExitNode(node *ast.Node) {}

func newTypeScriptNoFloatingPromises(context Context) Rule {
	return &typescriptNoFloatingPromisesRule{context: context}
}
