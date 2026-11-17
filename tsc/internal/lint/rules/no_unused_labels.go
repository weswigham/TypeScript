package rules

import (
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/astnav"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type noUnusedLabelsCoreRule struct {
	context Context
}

func newNoUnusedLabelsCoreRule(context Context) *noUnusedLabelsCoreRule {
	return &noUnusedLabelsCoreRule{
		context: context,
	}
}

func (rule *noUnusedLabelsCoreRule) OnEnterNode(node *ast.Node) bool {
	rule.checkLabel(node)
	return true
}

func (rule *noUnusedLabelsCoreRule) OnExitNode(node *ast.Node) {}

func (rule *noUnusedLabelsCoreRule) checkLabel(node *ast.Node) {
	if node.Kind != ast.KindLabeledStatement {
		return
	}
	statement := node.AsLabeledStatement()
	var used func(*ast.Node) bool
	used = func(child *ast.Node) bool {
		if ast.IsFunctionLike(child) || ast.IsClassLike(child) {
			return false
		}
		var label *ast.Node
		if child.Kind == ast.KindBreakStatement {
			label = child.AsBreakStatement().Label
		} else if child.Kind == ast.KindContinueStatement {
			label = child.AsContinueStatement().Label
		}
		return label != nil && label.Text() == statement.Label.Text() || child.ForEachChild(used)
	}
	if used(statement.Statement) {
		return
	}
	diagnostic := rule.context.Report(rule.context.Range(statement.Label), diagnostics.X_0_Colon_is_defined_but_never_used, statement.Label.Text())
	start := scanner.GetTokenPosOfNode(node, rule.context.File, false)
	bodyStart := scanner.GetTokenPosOfNode(statement.Statement, rule.context.File, false)
	if helpers.HasSourceCommentBetween(rule.context, start, bodyStart) {
		return
	}
	ancestor := node.Parent
	for ancestor.Kind == ast.KindLabeledStatement {
		ancestor = ancestor.Parent
	}
	if ancestor.Kind == ast.KindSourceFile || ancestor.Kind == ast.KindBlock && ancestor.Parent != nil && ast.IsFunctionLike(ancestor.Parent) {
		body := statement.Statement
		if body.Kind == ast.KindExpressionStatement {
			expression := ast.SkipParentheses(body.Expression())
			if expression.Kind == ast.KindStringLiteral || expression.Kind == ast.KindNoSubstitutionTemplateLiteral {
				return
			}
		}
	}
	previous := astnav.FindPrecedingToken(rule.context.File, start)
	if previous != nil && previous.Kind != ast.KindColonToken && previous.Kind != ast.KindSemicolonToken && previous.Kind != ast.KindOpenBraceToken && strings.ContainsRune("([ -+/`", rune(rule.context.File.Text()[bodyStart])) {
		return
	}
	rule.fixRange(diagnostic, start, bodyStart, "")
}

func (rule *noUnusedLabelsCoreRule) fixRange(diagnostic *ast.Diagnostic, start int, end int, replacement string) {
	if rule.context.NewTracker == nil {
		return
	}
	tracker := rule.context.NewTracker()
	tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(start, end), replacement)
	diagnostic.SetCodeFixes(codefix.CreateCodeFixAction("no-unused-labels", tracker.GetTextChanges(), ast.NewCompilerDiagnostic(diagnostics.Fix_0, "no-unused-labels"), "no-unused-labels", ast.NewCompilerDiagnostic(diagnostics.Fix_all_0, "no-unused-labels")))
}

func newNoUnusedLabelsCore(context Context) Rule { return newNoUnusedLabelsCoreRule(context) }
