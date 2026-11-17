package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/checker"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/ls/change"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type typescriptAwaitThenableRule struct {
	context     Context
	suggestions map[*ast.Diagnostic][]*codefix.CodeFixAction
}

func (rule *typescriptAwaitThenableRule) iterableValues(value *checker.Type) []*checker.Type {
	typeChecker := rule.context.GetChecker()
	if checker.IsTupleType(value) {
		return typeChecker.GetTypeArguments(value)
	}
	if index := typeChecker.GetNumberIndexType(value); index != nil && typeChecker.GetPropertyOfType(value, "length") != nil {
		return []*checker.Type{index}
	}
	if value.ObjectFlags()&checker.ObjectFlagsReference != 0 {
		arguments := typeChecker.GetTypeArguments(value)
		if len(arguments) > 0 {
			return arguments[:1]
		}
	}
	return nil
}

func (rule *typescriptAwaitThenableRule) checkAwaitThenable(node *ast.Node) {
	typeChecker := rule.context.GetChecker()
	switch node.Kind {
	case ast.KindAwaitExpression:
		if helpers.PromiseAwaitable(rule.context, node.Expression(), typeChecker.GetTypeAtLocation(node.Expression())) == -1 {
			diagnostic := rule.context.Report(rule.context.Range(node), diagnostics.Unexpected_await_of_a_non_Promise_non_Thenable_value)
			rule.action(diagnostic, ast.NewCompilerDiagnostic(diagnostics.Remove_unnecessary_await), false, func(tracker *change.Tracker) { helpers.PromiseRemoveAwait(rule.context, tracker, node) })
		}
	case ast.KindForOfStatement:
		loop := node.AsForInOrOfStatement()
		if loop.AwaitModifier == nil {
			return
		}
		value := typeChecker.GetTypeAtLocation(loop.Expression)
		if value.Flags()&checker.TypeFlagsAny != 0 || helpers.PromiseHasWellKnown(rule.context, value, "asyncIterator") {
			return
		}

		tokenScanner := scanner.GetScannerForSourceFile(rule.context.File, loop.Expression.End())
		for tokenScanner.Token() != ast.KindCloseParenToken && tokenScanner.Token() != ast.KindEndOfFile {
			tokenScanner.Scan()
		}
		diagnostic := rule.context.Report(

			core.NewTextRange(helpers.PromiseStart(rule.context, node), tokenScanner.TokenEnd()), diagnostics.Unexpected_for_await_of_of_a_value_that_is_not_async_iterable)

		rule.action(diagnostic, ast.NewCompilerDiagnostic(diagnostics.Convert_to_an_ordinary_for_of_loop), false, func(tracker *change.Tracker) { helpers.PromiseRemoveAwait(rule.context, tracker, node) })
	case ast.KindVariableDeclarationList:
		if node.Flags&ast.NodeFlagsBlockScoped != ast.NodeFlagsAwaitUsing {
			return
		}
		for _, declaration := range node.AsVariableDeclarationList().Declarations.Nodes {
			init := declaration.Initializer()
			if init == nil {
				continue
			}
			value := typeChecker.GetTypeAtLocation(init)
			if value.Flags()&checker.TypeFlagsAny != 0 || helpers.PromiseHasWellKnown(rule.context, value, "asyncDispose") {
				continue
			}
			diagnostic := rule.context.Report(rule.context.Range(init), diagnostics.Unexpected_await_using_of_a_value_that_is_not_async_disposable)
			if len(node.AsVariableDeclarationList().Declarations.Nodes) == 1 {
				rule.action(diagnostic, ast.NewCompilerDiagnostic(diagnostics.Remove_unnecessary_await), false, func(tracker *change.Tracker) { helpers.PromiseRemoveAwait(rule.context, tracker, node) })
			}
		}
	case ast.KindCallExpression:
		object, method := helpers.PromiseMember(rule.context, node.Expression())
		if object == nil || len(node.Arguments()) == 0 || method != "all" && method != "allSettled" && method != "race" && method != "any" || !helpers.PromiseBuiltin(rule.context, helpers.PromiseConstrained(rule.context, object), "PromiseConstructor") {
			return
		}
		argument := node.Arguments()[0]
		value := helpers.PromiseConstrained(rule.context, argument)
		if helpers.PromiseBoolean(rule.context, "allowMixedPromiseArrays", false) {
			for _, part := range helpers.PromiseParts(value) {
				for _, item := range rule.iterableValues(part) {
					for _, itemPart := range helpers.PromiseParts(item) {
						if helpers.PromiseAwaitable(rule.context, argument, itemPart) != -1 {
							return
						}
					}
				}
			}
		}
		if argument.Kind == ast.KindArrayLiteralExpression {
			for _, element := range argument.AsArrayLiteralExpression().Elements.Nodes {
				if element.Kind == ast.KindOmittedExpression {
					continue
				}
				if helpers.PromiseAwaitable(rule.context, element, helpers.PromiseConstrained(rule.context, element)) == -1 {
					rule.context.Report(rule.context.Range(element), diagnostics.Unexpected_iterable_of_non_Promise_non_Thenable_values_passed_to_promise_aggregator)
				}
			}
			return
		}
		for _, part := range helpers.PromiseParts(value) {
			if helpers.PromiseWellKnown(rule.context, part, "iterator") == nil {
				return
			}
		}
		for _, part := range helpers.PromiseParts(value) {
			for _, item := range rule.iterableValues(part) {
				for _, itemPart := range helpers.PromiseParts(item) {
					if helpers.PromiseAwaitable(rule.context, argument, itemPart) == -1 {
						rule.context.Report(rule.context.Range(argument), diagnostics.Unexpected_iterable_of_non_Promise_non_Thenable_values_passed_to_promise_aggregator)
						return
					}
				}
			}
		}
	}
}

func (rule *typescriptAwaitThenableRule) action(diagnostic *ast.Diagnostic, description *ast.Diagnostic, automatic bool, edit func(*change.Tracker)) {
	if rule.context.NewTracker == nil {
		return
	}
	tracker := rule.context.NewTracker()
	edit(tracker)
	action := codefix.CreateCodeFixAction("@typescript-eslint/"+"await-thenable", tracker.GetTextChanges(), description, "", nil)
	if automatic {
		diagnostic.SetCodeFixes(action)
		return
	}
	if rule.suggestions == nil {
		rule.suggestions = make(map[*ast.Diagnostic][]*codefix.CodeFixAction)
	}
	rule.suggestions[diagnostic] = append(rule.suggestions[diagnostic], action)
}

func (rule *typescriptAwaitThenableRule) Suggestions() map[*ast.Diagnostic][]*codefix.CodeFixAction {
	return rule.suggestions
}

func (rule *typescriptAwaitThenableRule) OnEnterNode(node *ast.Node) bool {
	rule.checkAwaitThenable(node)
	return true
}

func (rule *typescriptAwaitThenableRule) OnExitNode(node *ast.Node) {}

func newTypeScriptAwaitThenable(context Context) Rule {
	return &typescriptAwaitThenableRule{context: context}
}
