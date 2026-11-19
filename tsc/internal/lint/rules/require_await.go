package rules

import (
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/astnav"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/ls/change"
)

type requireAwait struct{ helpers.ReturnRuleContext }

func newRequireAwait(context Context) Rule {
	rule := &requireAwait{Context: context}

	return Rule{
		Exit: rule.OnExitNode,
		ExitKinds: []ast.Kind{
			ast.KindFunctionDeclaration,
			ast.KindFunctionExpression,
			ast.KindArrowFunction,
			ast.KindMethodDeclaration,
			ast.KindGetAccessor,
			ast.KindSetAccessor,
			ast.KindConstructor,
		},
		GetSuggestions: rule.Suggestions,
	}
}

func (rule *requireAwait) OnExitNode(node *ast.Node) {
	if !helpers.ReturnFunction(node) {
		return
	}
	helpers.AnalyzeFunctionReturns(node)
	rule.requireAwait(node)
}

func (rule *requireAwait) requireAwait(node *ast.Node) {
	if !helpers.ReturnAsync(node) || helpers.ReturnGenerator(node) {
		return
	}
	body := node.Body()
	if body.Kind == ast.KindBlock && len(body.AsBlock().Statements.Nodes) == 0 {
		return
	}
	hasAwait := false
	helpers.ReturnWalk(body, func(child *ast.Node) {
		if child.Kind == ast.KindAwaitExpression || child.Kind == ast.KindForOfStatement && child.AsForInOrOfStatement().AwaitModifier != nil || child.Kind == ast.KindVariableDeclarationList && child.Flags&ast.NodeFlagsAwaitUsing == ast.NodeFlagsAwaitUsing {
			hasAwait = true
		}
	})
	if hasAwait {
		return
	}
	report := rule.Context.Report(rule.Head(node, false), diagnostics.X_0_has_no_await_expression, helpers.ReturnCapitalize(helpers.ReturnName(node)))
	rule.Suggestion("require-await", report, diagnostics.Remove_async, func(tracker *change.Tracker) {
		if node.Modifiers() == nil {
			return
		}
		for _, token := range node.Modifiers().Nodes {
			if token.Kind != ast.KindAsyncKeyword {
				continue
			}
			end := token.End()
			text := rule.Context.File.Text()
			end = len(text) - len(strings.TrimLeftFunc(text[end:], helpers.TsCommentSpace))
			next := astnav.FindNextToken(token, rule.Context.File.AsNode(), rule.Context.File)
			replacement := ""
			if next != nil && (next.Kind == ast.KindOpenParenToken || next.Kind == ast.KindOpenBracketToken || next.Kind == ast.KindAsteriskToken) {
				previous := astnav.FindPrecedingToken(rule.Context.File, rule.Start(token))
				if previous != nil && previous.Kind != ast.KindSemicolonToken && previous.Kind != ast.KindOpenBraceToken && previous.Kind != ast.KindCloseBraceToken && previous.Kind != ast.KindCommaToken && previous.Kind != ast.KindEqualsToken && previous.End() < rule.Start(token) {
					if node.Parent.Kind == ast.KindExpressionStatement || node.Parent.Kind == ast.KindClassDeclaration || node.Parent.Kind == ast.KindClassExpression {
						replacement = ";"
					}
				}
			}
			tracker.ReplaceTextRangeWithText(rule.Context.File, core.NewTextRange(rule.Start(token), end), replacement)
			break
		}
	})
}
