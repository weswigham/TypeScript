package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

var tsNoNonNull = diagnostics.Forbidden_non_null_assertion

type typescriptNoNonNullAssertionRule struct {
	helpers.DiagnosticSuggestions
	context Context
}

func tsSyntaxIsAssignee(node *ast.Node) bool {
	for node.Parent != nil {
		parent := node.Parent
		switch parent.Kind {
		case ast.KindParenthesizedExpression, ast.KindAsExpression, ast.KindTypeAssertionExpression, ast.KindSatisfiesExpression, ast.KindNonNullExpression:
			node = parent
			continue
		case ast.KindDeleteExpression:
			return true
		}
		return ast.IsAssignmentTarget(node)
	}
	return false
}

func (rule *typescriptNoNonNullAssertionRule) OnEnterNode(node *ast.Node) bool {
	if node.Kind != ast.KindNonNullExpression {
		return true
	}
	diagnostic := rule.context.Report(rule.context.Range(node), tsNoNonNull)
	outer := node
	for outer.Parent.Kind == ast.KindParenthesizedExpression {
		outer = outer.Parent
	}
	parent := outer.Parent
	member := (parent.Kind == ast.KindPropertyAccessExpression || parent.Kind == ast.KindElementAccessExpression) && parent.Expression() == outer && !tsSyntaxIsAssignee(parent)
	call := parent.Kind == ast.KindCallExpression && parent.Expression() == outer
	if !member && !call {
		return true
	}
	tracker := rule.context.NewTracker()
	operator := core.NewTextRange(node.End()-1, node.End())
	if parent.QuestionDotToken() != nil {
		tracker.DeleteRange(rule.context.File, operator)
	} else if parent.Kind == ast.KindPropertyAccessExpression {
		tokenScanner := scanner.NewScanner()
		tokenScanner.SetText(rule.context.File.Text())
		tokenScanner.ResetPos(outer.End())
		if tokenScanner.Scan() != ast.KindDotToken {
			return true
		}
		tracker.DeleteRange(rule.context.File, operator)
		tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(tokenScanner.TokenStart(), tokenScanner.TokenStart()), "?")
	} else if outer == node {
		tracker.ReplaceTextRangeWithText(rule.context.File, operator, "?.")
	} else {
		tracker.DeleteRange(rule.context.File, operator)
		tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(outer.End(), outer.End()), "?.")
	}
	rule.AddSuggestion(diagnostic, "@typescript-eslint/no-non-null-assertion", tracker.GetTextChanges(), ast.NewCompilerDiagnostic(diagnostics.Consider_using_the_optional_chain_operator_instead_This_operator_includes_runtime_checks_so_it_is_safer_than_the_compile_only_non_null_assertion_operator))
	return true
}

func (rule *typescriptNoNonNullAssertionRule) OnExitNode(node *ast.Node) {}

func newTypeScriptNoNonNullAssertion(context Context) Rule {
	return &typescriptNoNonNullAssertionRule{context: context}
}
