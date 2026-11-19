package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/jsnum"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type typescriptNoMagicNumbersRule struct {
	context Context
}

func newTypeScriptNoMagicNumbers(context Context) Rule {
	rule := &typescriptNoMagicNumbersRule{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindBigIntLiteral, ast.KindNumericLiteral},
	}
}

func (rule *typescriptNoMagicNumbersRule) OnEnterNode(node *ast.Node) bool {
	rule.magicNumber(node)
	return true
}

func (rule *typescriptNoMagicNumbersRule) magicNumber(node *ast.Node) {
	if node.Kind != ast.KindNumericLiteral && node.Kind != ast.KindBigIntLiteral {
		return
	}
	full, parent := helpers.OuterParenthesizedNodeAndParent(node)
	negative := false
	if parent != nil && parent.Kind == ast.KindPrefixUnaryExpression && (parent.AsPrefixUnaryExpression().Operator == ast.KindMinusToken || parent.AsPrefixUnaryExpression().Operator == ast.KindPlusToken) {
		negative = parent.AsPrefixUnaryExpression().Operator == ast.KindMinusToken
		full = parent
	}
	_, parent = helpers.OuterParenthesizedNodeAndParent(full)
	value := float64(jsnum.FromString(node.Text()))
	if negative {
		value = -value
	}
	ignored, _ := rule.Options()["ignore"].([]any)
	for _, item := range ignored {
		if node.Kind == ast.KindBigIntLiteral {
			if text, ok := item.(string); ok {
				integer, valid := helpers.ParseBigIntLiteralValue(rule.Text(node))
				expected, expectedValid := helpers.ParseBigIntLiteralValue(text)
				if valid && expectedValid {
					if negative {
						integer.Neg(integer)
					}
					if integer.Cmp(expected) == 0 {
						return
					}
				}
			}
		} else {
			switch number := item.(type) {
			case float64:
				if number == value {
					return
				}
			case int:
				if float64(number) == value {
					return
				}
			}
		}
	}
	allowed, special := false, true
	if parent != nil && parent.Kind == ast.KindEnumMember {
		allowed = rule.Boolean("ignoreEnums", false)
	} else {
		literal := parent
		if literal != nil && literal.Kind == ast.KindLiteralType {
			ancestor := literal.Parent
			for ancestor.Kind == ast.KindParenthesizedType {
				ancestor = ancestor.Parent
			}
			numericType := ancestor.Kind == ast.KindTypeAliasDeclaration
			if ancestor.Kind == ast.KindUnionType {
				outer := ancestor.Parent
				for outer.Kind == ast.KindParenthesizedType {
					outer = outer.Parent
				}
				numericType = outer.Kind == ast.KindTypeAliasDeclaration
			}
			if numericType {
				allowed = rule.Boolean("ignoreNumericLiteralTypes", false)
			} else {
				special = false
			}
		} else {
			special = false
		}
		if !special {
			ancestor := parent
			if ancestor != nil && ancestor.Kind == ast.KindLiteralType {
				ancestor = ancestor.Parent
			}
			for ancestor != nil && (ancestor.Kind == ast.KindUnionType || ancestor.Kind == ast.KindIntersectionType || ancestor.Kind == ast.KindParenthesizedType) {
				ancestor = ancestor.Parent
			}
			if ancestor != nil && ancestor.Kind == ast.KindIndexedAccessType {
				special, allowed = true, rule.Boolean("ignoreTypeIndexes", false)
			}
		}
		if !special && parent != nil && parent.Kind == ast.KindPropertyDeclaration && ast.HasSyntacticModifier(parent, ast.ModifierFlagsReadonly) {
			special, allowed = true, rule.Boolean("ignoreReadonlyClassProperties", false)
		}
	}
	if special {
		if !allowed {
			report := node
			raw := rule.Text(node)
			if negative {
				report, raw = full, "-"+raw
			}
			rule.context.Report(rule.context.Range(report), diagnostics.No_magic_number_Colon_0, raw)
		}
		return
	}
	base := noMagicNumbers{context: rule.context}
	base.magicNumber(node)
}

func (rule *typescriptNoMagicNumbersRule) Options() map[string]any {
	if len(rule.context.Options) != 0 {
		options, _ := rule.context.Options[0].(map[string]any)
		return options
	}
	return nil
}

func (rule *typescriptNoMagicNumbersRule) Text(node *ast.Node) string {
	return rule.context.File.Text()[rule.Start(node):node.End()]
}

func (rule *typescriptNoMagicNumbersRule) Boolean(name string, fallback bool) bool {
	if value, ok := rule.Options()[name].(bool); ok {
		return value
	}
	return fallback
}

func (rule *typescriptNoMagicNumbersRule) Start(node *ast.Node) int {
	return scanner.GetTokenPosOfNode(node, rule.context.File, false)
}
