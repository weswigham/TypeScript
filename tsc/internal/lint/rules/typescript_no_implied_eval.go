package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type typescriptNoImpliedEvalRule struct{ context Context }

func newTypeScriptNoImpliedEval(context Context) Rule {
	rule := &typescriptNoImpliedEvalRule{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindCallExpression, ast.KindNewExpression},
	}
}

func (rule *typescriptNoImpliedEvalRule) OnEnterNode(node *ast.Node) bool {
	rule.checkImpliedEval(node)
	return true
}

func (rule *typescriptNoImpliedEvalRule) global(node *ast.Node, name string) bool {
	symbol := rule.context.GetChecker().ResolveName(name, node, ast.SymbolFlagsValue, false)
	return symbol == nil || helpers.PromiseLibrary(rule.context, symbol)
}

func (rule *typescriptNoImpliedEvalRule) checkImpliedEval(node *ast.Node) {
	if node.Kind != ast.KindCallExpression && node.Kind != ast.KindNewExpression {
		return
	}
	callee := ast.SkipParentheses(node.Expression())
	name := ""
	if callee.Kind == ast.KindIdentifier {
		name = callee.Text()
	} else {
		object, member := helpers.PromiseMember(rule.context, callee)
		if object == nil || object.Kind != ast.KindIdentifier || object.Text() != "global" && object.Text() != "globalThis" && object.Text() != "window" {
			return
		}
		name = member
	}
	if name == "Function" {
		value := rule.context.GetChecker().GetTypeAtLocation(callee)
		if value.Symbol() == nil || helpers.PromiseBuiltin(rule.context, value, "FunctionConstructor") {
			rule.context.Report(rule.context.Range(node), diagnostics.Implied_eval_Do_not_use_the_Function_constructor_to_create_functions)
			return
		}
	}
	if len(node.Arguments()) == 0 || name != "setTimeout" && name != "setInterval" && name != "setImmediate" && name != "execScript" || !rule.global(node, name) {
		return
	}
	handler := node.Arguments()[0]
	if handler.Kind == ast.KindArrowFunction || handler.Kind == ast.KindFunctionExpression {
		return
	}
	if handler.Kind == ast.KindCallExpression {
		_, member := helpers.PromiseMember(rule.context, handler.Expression())
		if member == "bind" {
			return
		}
	}
	value := rule.context.GetChecker().GetTypeAtLocation(handler)
	if helpers.PromiseCallable(rule.context, value) || helpers.PromiseBuiltin(rule.context, value, "Function") {
		return
	}
	rule.context.Report(rule.context.Range(handler), diagnostics.Implied_eval_Consider_passing_a_function)
}
