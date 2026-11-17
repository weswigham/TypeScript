package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/ls/change"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type noExtraLabel struct {
	context Context
}

func newNoExtraLabel(context Context) Rule { return &noExtraLabel{context: context} }

func (rule *noExtraLabel) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindBreakStatement || node.Kind == ast.KindContinueStatement {
		rule.extraLabel(node)
	}

	return true
}

func (rule *noExtraLabel) OnExitNode(node *ast.Node) {
}

func (rule *noExtraLabel) extraLabel(node *ast.Node) {
	label := helpers.SourceJumpLabel(node)
	if label == nil {
		return
	}
	for parent := node.Parent; parent != nil && !ast.IsFunctionLike(parent); parent = parent.Parent {
		if ast.IsIterationStatement(parent, false) || parent.Kind == ast.KindSwitchStatement {
			if parent.Parent != nil && parent.Parent.Kind == ast.KindLabeledStatement && parent.Parent.AsLabeledStatement().Label.Text() == label.Text() {
				diagnostic := rule.context.Report(rule.context.Range(label), diagnostics.This_label_0_is_unnecessary, label.Text())
				start := scanner.GetTokenPosOfNode(node, rule.context.File, false)
				labelStart := scanner.GetTokenPosOfNode(label, rule.context.File, false)
				if helpers.ContainsCommentTrivia(rule.context.File.Text()[start:labelStart]) || rule.context.NewTracker == nil {
					return
				}
				tracker := rule.context.NewTracker()
				var replacement *ast.Node
				if node.Kind == ast.KindBreakStatement {
					replacement = tracker.NewBreakStatement(nil)
				} else {
					replacement = tracker.NewContinueStatement(nil)
				}
				tracker.ReplaceNodePreservingComments(rule.context.File, node, replacement)
				rule.fix(diagnostic, tracker, ast.NewCompilerDiagnostic(diagnostics.Remove_unnecessary_label))
			}
			return
		}
		if parent.Kind == ast.KindLabeledStatement && parent.AsLabeledStatement().Label.Text() == label.Text() {
			return
		}
	}
}

func (rule *noExtraLabel) fix(diagnostic *ast.Diagnostic, tracker *change.Tracker, description *ast.Diagnostic) {
	diagnostic.SetCodeFixes(codefix.CreateCodeFixAction("no-extra-label", tracker.GetTextChanges(), description, "no-extra-label", description))
}
