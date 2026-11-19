package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type noPromiseExecutorReturnRule struct {
	helpers.DiagnosticSuggestions
	context Context
}

func newNoPromiseExecutorReturnRule(context Context) Rule {
	rule := &noPromiseExecutorReturnRule{context: context}

	return Rule{
		Enter:          rule.OnEnterNode,
		EnterKinds:     []ast.Kind{ast.KindArrowFunction, ast.KindReturnStatement},
		GetSuggestions: rule.Suggestions,
	}
}

func (rule *noPromiseExecutorReturnRule) OnEnterNode(node *ast.Node) bool {
	rule.checkPromiseReturn(node)
	return true
}

func (rule *noPromiseExecutorReturnRule) checkPromiseReturn(node *ast.Node) {
	var expression *ast.Node
	var arrow *ast.Node
	if node.Kind == ast.KindArrowFunction && node.Body().Kind != ast.KindBlock && rule.promiseExecutor(node) {
		arrow = node
		expression = ast.SkipParentheses(node.Body())
		node = node.Body()
	} else if node.Kind == ast.KindReturnStatement && node.Expression() != nil {
		for parent := node.Parent; parent != nil; parent = parent.Parent {
			if ast.IsFunctionLike(parent) {
				if rule.promiseExecutor(parent) {
					expression = ast.SkipParentheses(node.Expression())
				}
				break
			}
			if parent.Kind == ast.KindClassStaticBlockDeclaration || parent.Kind == ast.KindPropertyDeclaration {
				break
			}
		}
	}
	allowVoid := helpers.SharedRuleBool(helpers.SharedRuleOptions(rule.context.Options, 0), "allowVoid", false)
	if expression == nil || allowVoid && expression.Kind == ast.KindVoidExpression {
		return
	}
	diagnostic := rule.context.Report(rule.context.Range(node), diagnostics.Return_values_from_promise_executor_functions_cannot_be_read)
	if rule.context.NewTracker == nil {
		return
	}
	file := rule.context.File
	outer := node
	if node.Kind == ast.KindReturnStatement {
		outer = node.Expression()
	}
	start := scanner.GetTokenPosOfNode(outer, file, false)
	if allowVoid {
		tracker := rule.context.NewTracker()
		prefix, suffix := "void ", ""
		if outer == expression && ast.GetExpressionPrecedence(expression) < ast.OperatorPrecedenceUnary {
			prefix, suffix = "void (", ")"
		}
		if node.Kind == ast.KindReturnStatement && start == scanner.GetTokenPosOfNode(node, file, false)+len("return") {
			prefix = " " + prefix
		}
		tracker.ReplaceTextRangeWithText(file, core.NewTextRange(start, start), prefix)
		if suffix != "" {
			tracker.ReplaceTextRangeWithText(file, core.NewTextRange(outer.End(), outer.End()), suffix)
		}
		rule.AddSuggestion(diagnostic, "no-promise-executor-return", tracker.GetTextChanges(), ast.NewCompilerDiagnostic(diagnostics.Prepend_void_to_the_expression))
	}
	if arrow != nil && !((expression.Kind == ast.KindFunctionExpression || expression.Kind == ast.KindClassExpression) && expression.Name() == nil) {
		tracker := rule.context.NewTracker()
		tracker.ReplaceTextRangeWithText(file, core.NewTextRange(start, start), "{")
		tracker.ReplaceTextRangeWithText(file, core.NewTextRange(outer.End(), outer.End()), "}")
		rule.AddSuggestion(diagnostic, "no-promise-executor-return", tracker.GetTextChanges(), ast.NewCompilerDiagnostic(diagnostics.Wrap_the_expression_in))
	}
}

func (rule *noPromiseExecutorReturnRule) promiseExecutor(node *ast.Node) bool {
	if node == nil || node.Kind != ast.KindArrowFunction && node.Kind != ast.KindFunctionExpression {
		return false
	}
	outer := helpers.SharedParenthesizedOuter(node)
	parent := outer.Parent
	if parent == nil || parent.Kind != ast.KindNewExpression || len(parent.Arguments()) == 0 || parent.Arguments()[0] != outer {
		return false
	}
	callee := ast.SkipParentheses(parent.Expression())
	return callee.Kind == ast.KindIdentifier && callee.Text() == "Promise" && helpers.StatementBuiltin(rule.context, callee, true)
}
