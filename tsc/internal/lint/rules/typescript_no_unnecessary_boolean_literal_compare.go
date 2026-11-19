package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/checker"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type typescriptNoUnnecessaryBooleanLiteralCompareRule struct{ context Context }

func newTypeScriptNoUnnecessaryBooleanLiteralCompare(context Context) Rule {
	rule := &typescriptNoUnnecessaryBooleanLiteralCompareRule{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindSourceFile, ast.KindBinaryExpression},
	}
}

func (rule *typescriptNoUnnecessaryBooleanLiteralCompareRule) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindSourceFile && rule.context.CompilerOptions != nil && !rule.context.CompilerOptions.StrictNullChecks.IsTrue() && !rule.context.CompilerOptions.Strict.IsTrue() && !helpers.SemanticBooleanOption(rule.context, "allowRuleToRunWithoutStrictNullChecksIKnowWhatIAmDoing", false) {
		rule.context.Report(
			core.NewTextRange(0, 0), diagnostics.This_rule_requires_the_strictNullChecks_compiler_option_to_be_turned_on_to_function_correctly)
	}
	if node.Kind != ast.KindBinaryExpression {
		return true
	}
	binary := node.AsBinaryExpression()
	var negative bool
	switch binary.OperatorToken.Kind {
	case ast.KindExclamationEqualsToken, ast.KindExclamationEqualsEqualsToken:
		negative = true
	case ast.KindEqualsEqualsToken, ast.KindEqualsEqualsEqualsToken:
		negative = false
	default:
		return true
	}
	expression, literal := binary.Left, ast.SkipParentheses(binary.Right)
	if literal.Kind != ast.KindTrueKeyword && literal.Kind != ast.KindFalseKeyword {
		expression, literal = binary.Right, ast.SkipParentheses(binary.Left)
	}
	if literal.Kind != ast.KindTrueKeyword && literal.Kind != ast.KindFalseKeyword {
		return true
	}
	nullable, boolean := false, false
	for _, part := range helpers.SemanticUnionParts(helpers.SemanticTypeAtLocation(rule.context, expression)) {
		if part.Flags()&(checker.TypeFlagsNull|checker.TypeFlagsUndefined) != 0 {
			nullable = true
		} else if part.Flags()&checker.TypeFlagsBooleanLike != 0 {
			boolean = true
		} else {
			return true
		}
	}
	if !boolean {
		return true
	}
	isFalse := literal.Kind == ast.KindFalseKeyword
	if nullable && (isFalse && helpers.SemanticBooleanOption(rule.context, "allowComparingNullableBooleansToFalse", true) || !isFalse && helpers.SemanticBooleanOption(rule.context, "allowComparingNullableBooleansToTrue", true)) {
		return true
	}
	message := diagnostics.This_expression_unnecessarily_compares_a_boolean_value_to_a_boolean_instead_of_using_it_directly
	if negative {
		message = diagnostics.This_expression_unnecessarily_compares_a_boolean_value_to_a_boolean_instead_of_negating_it
	}
	if nullable {
		message = diagnostics.This_expression_unnecessarily_compares_a_nullable_boolean_value_to_false_instead_of_using_the_operator_to_provide_a_default
		if !isFalse {
			message = diagnostics.This_expression_unnecessarily_compares_a_nullable_boolean_value_to_true_instead_of_using_it_directly
			if negative {
				message = diagnostics.This_expression_unnecessarily_compares_a_nullable_boolean_value_to_true_instead_of_negating_it
			}
		}
	}
	diagnostic := rule.context.Report(rule.context.Range(node), message)
	target := node
	for target.Parent != nil && target.Parent.Kind == ast.KindParenthesizedExpression {
		target = target.Parent
	}
	negatedParent := target.Parent != nil && target.Parent.Kind == ast.KindPrefixUnaryExpression && target.Parent.AsPrefixUnaryExpression().Operator == ast.KindExclamationToken
	if negatedParent {
		target = target.Parent
	}
	negated := (negative != isFalse) != negatedParent
	text := helpers.SemanticSourceText(rule.context, expression)
	weak := !helpers.SemanticStrongExpression(expression)
	wrap := func() {
		if weak {
			text = "(" + text + ")"
			weak = false
		}
	}
	if !negated && nullable && !helpers.SemanticInCondition(target) {
		wrap()
		text += " ?? false"
		weak = true
	} else {
		if nullable && isFalse {
			wrap()
			text += " ?? true"
			weak = true
		}
		if negated {
			wrap()
			text = "!" + text
			weak = false
		}
	}
	if weak && target.Parent != nil && (target.Parent.Kind == ast.KindBinaryExpression || target.Parent.Kind == ast.KindPropertyAccessExpression || target.Parent.Kind == ast.KindCallExpression || target.Parent.Kind == ast.KindPrefixUnaryExpression) {
		text = "(" + text + ")"
	}
	diagnostic.SetCodeFixes(noUnnecessaryBooleanLiteralCompareReplace(rule.context, target, text)...)
	return true
}

func noUnnecessaryBooleanLiteralCompareReplace(context Context, node *ast.Node, text string) []*codefix.CodeFixAction {
	tracker := context.NewTracker()
	tracker.ReplaceTextRangeWithText(context.File, core.NewTextRange(scanner.GetTokenPosOfNode(node, context.File, false), node.End()), text)
	return []*codefix.CodeFixAction{codefix.CreateCodeFixAction("@typescript-eslint/no-unnecessary-boolean-literal-compare", tracker.GetTextChanges(), ast.NewCompilerDiagnostic(diagnostics.Remove_unnecessary_boolean_comparison), "", nil)}
}
