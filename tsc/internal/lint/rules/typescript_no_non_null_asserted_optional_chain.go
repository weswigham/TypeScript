package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type typescriptNoNonNullAssertedOptionalChainRule struct {
	context Context
	helpers.DiagnosticSuggestions
}

func newTypeScriptNoNonNullAssertedOptionalChain(context Context) Rule {
	rule := &typescriptNoNonNullAssertedOptionalChainRule{context: context}

	return Rule{
		Enter:          rule.OnEnterNode,
		EnterKinds:     []ast.Kind{ast.KindNonNullExpression},
		GetSuggestions: rule.Suggestions,
	}
}

func (rule *typescriptNoNonNullAssertedOptionalChainRule) OnEnterNode(node *ast.Node) bool {
	rule.nonNullChain(node)
	return true
}

func (rule *typescriptNoNonNullAssertedOptionalChainRule) nonNullChain(node *ast.Node) {
	if node.Kind != ast.KindNonNullExpression {
		return
	}
	inner := ast.SkipParentheses(node.Expression())
	if !ast.IsOptionalChain(inner) {
		return
	}
	report := node
	if inner != node.Expression() {
		report = inner
	} else {
		parent := node.Parent
		if ast.IsOptionalChain(parent) && parent.Expression() == node {
			return
		}
	}
	diagnostic := rule.context.Report(rule.context.Range(report), diagnostics.Optional_chain_expressions_can_return_undefined_by_design_using_a_non_null_assertion_is_unsafe_and_wrong)
	rule.suggest(diagnostic, node.End()-1, node.End(), "", ast.NewCompilerDiagnostic(diagnostics.You_should_remove_the_non_null_assertion))
}

func (rule *typescriptNoNonNullAssertedOptionalChainRule) suggest(diagnostic *ast.Diagnostic, start, end int, text string, description *ast.Diagnostic) {
	tracker := rule.context.NewTracker()
	tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(start, end), text)
	rule.AddSuggestion(diagnostic, "@typescript-eslint/no-non-null-asserted-optional-chain", tracker.GetTextChanges(), description)
}
