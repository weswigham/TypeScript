package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type validTypeofRule struct{ context Context }

func newValidTypeofRule(context Context) Rule {
	return &validTypeofRule{context: context}
}

func (rule *validTypeofRule) OnEnterNode(node *ast.Node) bool {
	rule.typeofComparison(node)
	return true
}

func (rule *validTypeofRule) OnExitNode(node *ast.Node) {}

func (rule *validTypeofRule) typeofComparison(node *ast.Node) {
	if node.Kind != ast.KindTypeOfExpression {
		return
	}
	outer, parent := helpers.OuterParenthesizedNodeAndParent(node)
	if parent == nil || parent.Kind != ast.KindBinaryExpression {
		return
	}
	binary := parent.AsBinaryExpression()
	var sibling *ast.Node
	switch binary.OperatorToken.Kind {
	case ast.KindEqualsEqualsToken, ast.KindEqualsEqualsEqualsToken, ast.KindExclamationEqualsToken, ast.KindExclamationEqualsEqualsToken:
		sibling = binary.Left
	default:
		return
	}
	if sibling == outer {
		sibling = binary.Right
	}
	sibling = ast.SkipParentheses(sibling)
	valid := false
	switch sibling.Kind {
	case ast.KindStringLiteral, ast.KindNoSubstitutionTemplateLiteral:
		switch sibling.Text() {
		case "symbol", "undefined", "object", "boolean", "number", "string", "function", "bigint":
			valid = true
		}
		if !valid {
			rule.context.Report(rule.context.Range(sibling), diagnostics.Invalid_typeof_comparison_value)
		}
		return
	case ast.KindNumericLiteral, ast.KindBigIntLiteral, ast.KindRegularExpressionLiteral, ast.KindTrueKeyword, ast.KindFalseKeyword, ast.KindNullKeyword:
		rule.context.Report(rule.context.Range(sibling), diagnostics.Invalid_typeof_comparison_value)
		return
	}
	if helpers.SharedRuleBoolean(rule.context.Options, "requireStringLiterals", false) && sibling.Kind != ast.KindTypeOfExpression {
		rule.context.Report(rule.context.Range(sibling), diagnostics.Typeof_comparisons_should_be_to_string_literals)
	} else if sibling.Kind == ast.KindIdentifier && sibling.Text() == "undefined" && helpers.StatementBuiltin(rule.context, sibling, true) {
		rule.context.Report(rule.context.Range(sibling), diagnostics.Invalid_typeof_comparison_value)
	}
}
