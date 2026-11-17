package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/ls/change"
)

type typescriptNoExtraNonNullAssertionRule struct {
	context Context
}

func (rule *typescriptNoExtraNonNullAssertionRule) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindNonNullExpression {
		outer, parent := helpers.OuterParenthesizedNodeAndParent(node)
		if parent != nil && (parent.Kind == ast.KindNonNullExpression || (ast.IsAccessExpression(parent) || parent.Kind == ast.KindCallExpression) && parent.Expression() == outer && parent.QuestionDotToken() != nil) {
			diagnostic := rule.context.Report(rule.context.Range(node), diagnostics.Forbidden_extra_non_null_assertion)
			if rule.context.NewTracker != nil {
				tracker := rule.context.NewTracker()
				tracker.DeleteRange(rule.context.File, core.NewTextRange(node.End()-1, node.End()))
				rule.fix(diagnostic, tracker, ast.NewCompilerDiagnostic(diagnostics.Remove_extra_non_null_assertion))
			}
		}
	}
	return true
}

func (rule *typescriptNoExtraNonNullAssertionRule) OnExitNode(node *ast.Node) {}

func (rule *typescriptNoExtraNonNullAssertionRule) fix(diagnostic *ast.Diagnostic, tracker *change.Tracker, description *ast.Diagnostic) {
	name := "@typescript-eslint/no-extra-non-null-assertion"
	diagnostic.SetCodeFixes(codefix.CreateCodeFixAction(name, tracker.GetTextChanges(), description, name, description))
}

func newTypeScriptNoExtraNonNullAssertion(context Context) Rule {
	return &typescriptNoExtraNonNullAssertionRule{context: context}
}
