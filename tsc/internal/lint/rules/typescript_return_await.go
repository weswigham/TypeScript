package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/ls/change"
)

type typescriptReturnAwaitRule struct {
	context     Context
	functions   []*ast.Node
	suggestions map[*ast.Diagnostic][]*codefix.CodeFixAction
}

func newTypeScriptReturnAwait(context Context) Rule {
	rule := &typescriptReturnAwaitRule{context: context}

	return Rule{
		Enter: rule.OnEnterNode,
		EnterKinds: []ast.Kind{
			ast.KindFunctionDeclaration,
			ast.KindMethodDeclaration,
			ast.KindConstructor,
			ast.KindGetAccessor,
			ast.KindSetAccessor,
			ast.KindFunctionExpression,
			ast.KindArrowFunction,
			ast.KindMethodSignature,
			ast.KindCallSignature,
			ast.KindJSDocSignature,
			ast.KindConstructSignature,
			ast.KindIndexSignature,
			ast.KindFunctionType,
			ast.KindConstructorType,
			ast.KindReturnStatement,
		},
		Exit: rule.OnExitNode,
		ExitKinds: []ast.Kind{
			ast.KindFunctionDeclaration,
			ast.KindMethodDeclaration,
			ast.KindConstructor,
			ast.KindGetAccessor,
			ast.KindSetAccessor,
			ast.KindFunctionExpression,
			ast.KindArrowFunction,
			ast.KindMethodSignature,
			ast.KindCallSignature,
			ast.KindJSDocSignature,
			ast.KindConstructSignature,
			ast.KindIndexSignature,
			ast.KindFunctionType,
			ast.KindConstructorType,
		},
		GetSuggestions: rule.Suggestions,
	}
}

func (rule *typescriptReturnAwaitRule) OnEnterNode(node *ast.Node) bool {
	rule.enterAwaitFunction(node)
	return true
}

func (rule *typescriptReturnAwaitRule) OnExitNode(node *ast.Node) { rule.exitAwaitFunction(node) }

func (rule *typescriptReturnAwaitRule) enterAwaitFunction(node *ast.Node) {
	if helpers.PromiseFunctionLike(node) {
		rule.functions = append(rule.functions, node)
		if node.Kind == ast.KindArrowFunction && ast.HasSyntacticModifier(node, ast.ModifierFlagsAsync) && node.Body().Kind != ast.KindBlock {
			rule.returnAwait(node.Body())
		}
	}
	if len(rule.functions) == 0 {
		return
	}
	scope := rule.functions[len(rule.functions)-1]
	if node.Kind == ast.KindReturnStatement && node.Expression() != nil && ast.HasSyntacticModifier(scope, ast.ModifierFlagsAsync) {
		rule.returnAwait(node.Expression())
	}
}

func (rule *typescriptReturnAwaitRule) exitAwaitFunction(node *ast.Node) {
	if helpers.PromiseFunctionLike(node) {
		rule.functions = rule.functions[:len(rule.functions)-1]
	}
}

func (rule *typescriptReturnAwaitRule) errorHandling(node *ast.Node) bool {
	usingBeforeReturn := func(statements []*ast.Node) bool {
		for _, statement := range statements {
			if statement.End() >= node.Pos() {
				break
			}
			if statement.Kind == ast.KindVariableStatement && statement.AsVariableStatement().DeclarationList.Flags&ast.NodeFlagsUsing != 0 {
				return true
			}
		}
		return false
	}
	child := node
	for parent := node.Parent; parent != nil && !ast.IsFunctionLike(parent); parent = parent.Parent {
		if parent.Kind == ast.KindForOfStatement || parent.Kind == ast.KindForInStatement {
			initializer := parent.AsForInOrOfStatement().Initializer
			if initializer.Kind == ast.KindVariableDeclarationList && initializer.Flags&ast.NodeFlagsUsing != 0 {
				return true
			}
		}
		if parent.Kind == ast.KindTryStatement {
			statement := parent.AsTryStatement()
			if child == statement.TryBlock || child == statement.CatchClause && statement.FinallyBlock != nil {
				return true
			}
		}
		if parent.Kind == ast.KindBlock && usingBeforeReturn(parent.AsBlock().Statements.Nodes) {
			return true
		}
		if parent.Kind == ast.KindCaseBlock {
			for _, clause := range parent.AsCaseBlock().Clauses.Nodes {
				if usingBeforeReturn(clause.AsCaseOrDefaultClause().Statements.Nodes) {
					return true
				}
			}
		}
		child = parent
	}
	return false
}

func (rule *typescriptReturnAwaitRule) returnAwait(node *ast.Node) {
	node = ast.SkipParentheses(node)
	if node.Kind == ast.KindConditionalExpression {
		rule.returnAwait(node.AsConditionalExpression().WhenFalse)
		rule.returnAwait(node.AsConditionalExpression().WhenTrue)
		return
	}
	expression := node
	await := node.Kind == ast.KindAwaitExpression
	if await {
		expression = node.Expression()
	}
	certainty := helpers.PromiseAwaitable(rule.context, expression, rule.context.GetChecker().GetTypeAtLocation(expression))
	if certainty != 1 {
		if await && certainty == -1 {
			diagnostic := rule.context.Report(rule.context.Range(node), diagnostics.Returning_an_awaited_value_that_is_not_a_promise_is_not_allowed)
			rule.action(diagnostic, ast.NewCompilerDiagnostic(diagnostics.Remove_unnecessary_await), true, func(tracker *change.Tracker) { helpers.PromiseRemoveAwait(rule.context, tracker, node) })
		}
		return
	}
	mode := "in-try-catch"
	if len(rule.context.Options) > 0 {
		if option, ok := rule.context.Options[0].(string); ok {
			mode = option
		}
	}
	handling := rule.errorHandling(node)
	if !handling && mode == "error-handling-correctness-only" {
		return
	}
	requireAwait := mode == "always" || handling && mode != "never"
	if requireAwait == await {
		return
	}
	if requireAwait {
		diagnostic := rule.context.Report(rule.context.Range(node), diagnostics.Returning_an_awaited_promise_is_required_in_this_context)
		rule.action(diagnostic, ast.NewCompilerDiagnostic(diagnostics.Add_await_before_the_expression_Use_caution_as_this_may_impact_control_flow), !handling, func(tracker *change.Tracker) { helpers.PromiseInsertOperator(rule.context, tracker, node, "await") })
	} else {
		diagnostic := rule.context.Report(rule.context.Range(node), diagnostics.Returning_an_awaited_promise_is_not_allowed_in_this_context)
		rule.action(diagnostic, ast.NewCompilerDiagnostic(diagnostics.Remove_await_before_the_expression_Use_caution_as_this_may_impact_control_flow), !handling, func(tracker *change.Tracker) { helpers.PromiseRemoveAwait(rule.context, tracker, node) })
	}
}

func (rule *typescriptReturnAwaitRule) action(diagnostic *ast.Diagnostic, description *ast.Diagnostic, automatic bool, edit func(*change.Tracker)) {
	if rule.context.NewTracker == nil {
		return
	}
	tracker := rule.context.NewTracker()
	edit(tracker)
	action := codefix.CreateCodeFixAction("@typescript-eslint/"+"return-await", tracker.GetTextChanges(), description, "", nil)
	if automatic {
		diagnostic.SetCodeFixes(action)
		return
	}
	if rule.suggestions == nil {
		rule.suggestions = make(map[*ast.Diagnostic][]*codefix.CodeFixAction)
	}
	rule.suggestions[diagnostic] = append(rule.suggestions[diagnostic], action)
}

func (rule *typescriptReturnAwaitRule) Suggestions() map[*ast.Diagnostic][]*codefix.CodeFixAction {
	return rule.suggestions
}
