package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/ls/change"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type typescriptNoConfusingNonNullAssertionRule struct {
	context Context
	helpers.DiagnosticSuggestions
}

func newTypeScriptNoConfusingNonNullAssertion(context Context) Rule {
	rule := &typescriptNoConfusingNonNullAssertionRule{context: context}

	return Rule{
		Enter:          rule.OnEnterNode,
		EnterKinds:     []ast.Kind{ast.KindBinaryExpression},
		GetSuggestions: rule.Suggestions,
	}
}

func (rule *typescriptNoConfusingNonNullAssertionRule) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindBinaryExpression {
		rule.confusingAssertion(node)
	}
	return true
}

func (rule *typescriptNoConfusingNonNullAssertionRule) confusingAssertion(node *ast.Node) {
	binary := node.AsBinaryExpression()
	operator := binary.OperatorToken.Kind
	if operator != ast.KindEqualsToken && operator != ast.KindEqualsEqualsToken && operator != ast.KindEqualsEqualsEqualsToken && operator != ast.KindInKeyword && operator != ast.KindInstanceOfKeyword {
		return
	}
	text := rule.Text(binary.Left)
	if len(text) == 0 || text[len(text)-1] != '!' {
		return
	}
	message := diagnostics.Confusing_combination_of_non_null_assertion_and_0_operator_like_a_0_b_which_might_be_misinterpreted_as_a_0_b
	description := ast.NewCompilerDiagnostic(diagnostics.Remove_possibly_unnecessary_non_null_assertion_in_the_left_operand_of_the_0_operator, scanner.TokenToString(operator))
	if operator == ast.KindEqualsToken {
		message = diagnostics.Confusing_combination_of_non_null_assertion_and_assignment_like_a_b_which_looks_very_similar_to_a_b
		description = ast.NewCompilerDiagnostic(diagnostics.Remove_unnecessary_non_null_assertion_in_assignment_left_hand_side)
	} else if operator == ast.KindEqualsEqualsToken || operator == ast.KindEqualsEqualsEqualsToken {
		message = diagnostics.Confusing_combination_of_non_null_assertion_and_equality_test_like_a_b_which_looks_very_similar_to_a_b
		description = ast.NewCompilerDiagnostic(diagnostics.Remove_unnecessary_non_null_assertion_in_equality_test)
	}
	diagnostic := rule.context.Report(rule.context.Range(node), message, scanner.TokenToString(operator))
	if rule.context.NewTracker == nil {
		return
	}
	if binary.Left.Kind == ast.KindNonNullExpression {
		tracker := rule.context.NewTracker()
		tracker.DeleteRange(rule.context.File, core.NewTextRange(binary.Left.End()-1, binary.Left.End()))
		rule.suggest(diagnostic, tracker, description)
		if operator != ast.KindInKeyword && operator != ast.KindInstanceOfKeyword {
			return
		}
	}
	tracker := rule.context.NewTracker()
	rule.replace(tracker, binary.Left, tracker.NewParenthesizedExpression(binary.Left))
	rule.suggest(diagnostic, tracker, ast.NewCompilerDiagnostic(diagnostics.Wrap_the_left_hand_side_in_parentheses_to_avoid_confusion_with_0_operator, scanner.TokenToString(operator)))
}

func (rule *typescriptNoConfusingNonNullAssertionRule) Text(node *ast.Node) string {
	return rule.context.File.Text()[scanner.GetTokenPosOfNode(node, rule.context.File, false):node.End()]
}

func (rule *typescriptNoConfusingNonNullAssertionRule) suggest(diagnostic *ast.Diagnostic, tracker *change.Tracker, description *ast.Diagnostic) {
	rule.AddSuggestion(diagnostic, "@typescript-eslint/no-confusing-non-null-assertion", tracker.GetTextChanges(), description)
}

func (rule *typescriptNoConfusingNonNullAssertionRule) replace(tracker *change.Tracker, node, replacement *ast.Node) {
	tracker.ReplaceNodePreservingComments(rule.context.File, node, replacement)
}
