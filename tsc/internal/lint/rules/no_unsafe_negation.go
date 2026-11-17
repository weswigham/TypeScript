package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/ls/change"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type noUnsafeNegationRule struct {
	context     Context
	suggestions map[*ast.Diagnostic][]*codefix.CodeFixAction
}

func (rule *noUnsafeNegationRule) OnEnterNode(node *ast.Node) bool {
	rule.unsafeNegation(node)

	return true
}

func (rule *noUnsafeNegationRule) OnExitNode(node *ast.Node) {}

func (rule *noUnsafeNegationRule) Suggestions() map[*ast.Diagnostic][]*codefix.CodeFixAction {
	return rule.suggestions
}

func (rule *noUnsafeNegationRule) boolean(index int, name string, fallback bool) bool {
	object, _ := rule.option(index).(map[string]any)
	if value, ok := object[name].(bool); ok {
		return value
	}
	return fallback
}

func (rule *noUnsafeNegationRule) option(index int) any {
	if index < len(rule.context.Options) {
		return rule.context.Options[index]
	}
	return nil
}

func (rule *noUnsafeNegationRule) suggest(diagnostic *ast.Diagnostic, old *ast.Node, message *diagnostics.Message, build func(*change.Tracker) *ast.Node, args ...any) {
	if rule.context.NewTracker == nil {
		return
	}
	tracker := rule.context.NewTracker()
	tracker.ReplaceNodePreservingComments(rule.context.File, old, build(tracker))
	if rule.suggestions == nil {
		rule.suggestions = make(map[*ast.Diagnostic][]*codefix.CodeFixAction)
	}
	rule.suggestions[diagnostic] = append(rule.suggestions[diagnostic], codefix.CreateCodeFixAction("no-unsafe-negation", tracker.GetTextChanges(), ast.NewCompilerDiagnostic(message, args...), "", nil))
}

func (rule *noUnsafeNegationRule) unsafeNegation(node *ast.Node) {
	if node.Kind != ast.KindBinaryExpression {
		return
	}
	binary := node.AsBinaryExpression()
	kind := binary.OperatorToken.Kind
	ordering := kind == ast.KindLessThanToken || kind == ast.KindLessThanEqualsToken || kind == ast.KindGreaterThanToken || kind == ast.KindGreaterThanEqualsToken
	if kind != ast.KindInKeyword && kind != ast.KindInstanceOfKeyword && !(ordering && rule.boolean(0, "enforceForOrderingRelations", false)) {
		return
	}
	left := binary.Left
	if left.Kind != ast.KindPrefixUnaryExpression || left.AsPrefixUnaryExpression().Operator != ast.KindExclamationToken {
		return
	}
	operator := scanner.TokenToString(kind)
	diagnostic := rule.context.Report(rule.context.Range(left), diagnostics.Unexpected_negating_the_left_operand_of_0_operator, operator)
	rule.suggest(diagnostic, node, diagnostics.Negate_0_expression_instead_of_its_left_operand_This_changes_the_current_behavior, func(tracker *change.Tracker) *ast.Node {
		comparison := tracker.NewBinaryExpression(nil, left.AsPrefixUnaryExpression().Operand, nil, tracker.NewToken(kind), binary.Right)
		return tracker.NewPrefixUnaryExpression(ast.KindExclamationToken, tracker.NewParenthesizedExpression(comparison))
	}, operator)
	rule.suggest(diagnostic, left, diagnostics.Wrap_negation_in_to_make_the_intention_explicit_This_preserves_the_current_behavior, func(tracker *change.Tracker) *ast.Node {
		return tracker.NewParenthesizedExpression(tracker.DeepCloneReparse(left))
	})
}

func newNoUnsafeNegation(context Context) Rule { return &noUnsafeNegationRule{context: context} }
