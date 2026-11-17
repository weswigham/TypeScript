package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type typescriptNoNonNullAssertedNullishCoalescingRule struct {
	helpers.TypescriptScopeRuleContext
}

func (rule *typescriptNoNonNullAssertedNullishCoalescingRule) OnEnterNode(node *ast.Node) bool {
	rule.nonNullCoalescing(node)
	return true
}

func (rule *typescriptNoNonNullAssertedNullishCoalescingRule) OnExitNode(node *ast.Node) {}

func (rule *typescriptNoNonNullAssertedNullishCoalescingRule) nonNullCoalescing(node *ast.Node) {
	if node.Kind != ast.KindBinaryExpression || node.AsBinaryExpression().OperatorToken.Kind != ast.KindQuestionQuestionToken {
		return
	}
	left := ast.SkipParentheses(node.AsBinaryExpression().Left)
	if left.Kind != ast.KindNonNullExpression {
		return
	}
	value := ast.SkipParentheses(left.Expression())
	if value.Kind == ast.KindIdentifier {
		binding := rule.Bindings().Nodes[value].Find(value.Text())
		if binding != nil {
			assigned := false
			for _, declaration := range binding.Declarations {
				if declaration.Kind == ast.KindVariableDeclaration && (declaration.Initializer() != nil || declaration.AsVariableDeclaration().ExclamationToken != nil) && declaration.End() < left.End() {
					assigned = true
				}
			}
			for _, reference := range binding.References {
				if reference.Write && reference.Node.End() < left.End() {
					assigned = true
				}
			}
			if !assigned {
				return
			}
		}
	}
	diagnostic := rule.Context.Report(rule.Context.Range(left), diagnostics.The_nullish_coalescing_operator_is_designed_to_handle_undefined_and_null_using_a_non_null_assertion_is_not_needed)
	rule.Edits(diagnostic, ast.NewCompilerDiagnostic(diagnostics.Remove_the_non_null_assertion), helpers.TsScopeEdit{Start: left.End() - 1, End: left.End(), Text: ""})
}

func newTypeScriptNoNonNullAssertedNullishCoalescing(context Context) Rule {
	return &typescriptNoNonNullAssertedNullishCoalescingRule{Context: context, Name: "no-non-null-asserted-nullish-coalescing"}
}
