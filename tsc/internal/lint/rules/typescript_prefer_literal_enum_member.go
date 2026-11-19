package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type typescriptPreferLiteralEnumMemberRule struct {
	context Context
}

func newTypeScriptPreferLiteralEnumMember(context Context) Rule {
	rule := &typescriptPreferLiteralEnumMemberRule{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindEnumMember},
	}
}

func (rule *typescriptPreferLiteralEnumMemberRule) OnEnterNode(node *ast.Node) bool {
	rule.literalEnum(node)
	return true
}

func (rule *typescriptPreferLiteralEnumMemberRule) literalEnum(node *ast.Node) {
	if node.Kind != ast.KindEnumMember || node.Initializer() == nil {
		return
	}
	declaration := node.Parent
	allowBitwise := rule.Boolean("allowBitwiseExpressions", false)
	memberName := func(value *ast.Node) bool {
		name := ""
		if value.Kind == ast.KindIdentifier {
			name = value.Text()
		} else if ast.IsAccessExpression(value) && value.Expression().Kind == ast.KindIdentifier && value.Expression().Text() == declaration.Name().Text() {
			if value.Kind == ast.KindPropertyAccessExpression {
				name = value.Name().Text()
			} else {
				argument := ast.SkipParentheses(value.AsElementAccessExpression().ArgumentExpression)
				if argument.Kind == ast.KindStringLiteral || argument.Kind == ast.KindNoSubstitutionTemplateLiteral {
					name = argument.Text()
				} else if argument.Kind == ast.KindIdentifier {
					name = argument.Text()
				}
			}
		}
		if name == "" {
			return false
		}
		for _, member := range declaration.AsEnumDeclaration().Members.Nodes {
			if member.Name().Text() == name {
				return true
			}
		}
		return false
	}
	var allowed func(*ast.Node, bool) bool
	allowed = func(value *ast.Node, bitwise bool) bool {
		value = ast.SkipParentheses(value)
		if bitwise && memberName(value) {
			return true
		}
		if helpers.TypescriptEnumLiteral(value) || value.Kind == ast.KindNoSubstitutionTemplateLiteral {
			return true
		}
		if value.Kind == ast.KindPrefixUnaryExpression {
			unary := value.AsPrefixUnaryExpression()
			if unary.Operator == ast.KindPlusToken || unary.Operator == ast.KindMinusToken {
				return allowed(unary.Operand, bitwise)
			}
			return allowBitwise && unary.Operator == ast.KindTildeToken && allowed(unary.Operand, true)
		}
		if allowBitwise && value.Kind == ast.KindBinaryExpression {
			binary := value.AsBinaryExpression()
			switch binary.OperatorToken.Kind {
			case ast.KindAmpersandToken, ast.KindCaretToken, ast.KindLessThanLessThanToken, ast.KindGreaterThanGreaterThanToken, ast.KindGreaterThanGreaterThanGreaterThanToken, ast.KindBarToken:
				return allowed(binary.Left, true) && allowed(binary.Right, true)
			}
		}
		return false
	}
	if allowed(node.Initializer(), false) {
		return
	}
	if allowBitwise {
		rule.context.Report(rule.context.Range(node.Name()), diagnostics.Explicit_enum_value_must_only_be_a_literal_value_string_or_number_or_a_bitwise_expression)
	} else {
		rule.context.Report(rule.context.Range(node.Name()), diagnostics.Explicit_enum_value_must_only_be_a_literal_value_string_or_number)
	}
}

func (rule *typescriptPreferLiteralEnumMemberRule) Boolean(name string, fallback bool) bool {
	if value, ok := rule.Options()[name].(bool); ok {
		return value
	}
	return fallback
}

func (rule *typescriptPreferLiteralEnumMemberRule) Options() map[string]any {
	if len(rule.context.Options) != 0 {
		options, _ := rule.context.Options[0].(map[string]any)
		return options
	}
	return nil
}
