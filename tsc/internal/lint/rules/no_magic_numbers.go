package rules

import (
	"math"
	"math/big"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/jsnum"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type noMagicNumbers struct {
	context Context
	name    string
}

func newNoMagicNumbers(context Context) Rule {
	rule := &noMagicNumbers{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindBigIntLiteral, ast.KindNumericLiteral},
	}
}

func (rule *noMagicNumbers) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindNumericLiteral || node.Kind == ast.KindBigIntLiteral {
		rule.magicNumber(node)
	}

	return true
}

func (rule *noMagicNumbers) Options() map[string]any {
	if len(rule.context.Options) > 0 {
		options, _ := rule.context.Options[0].(map[string]any)
		return options
	}
	return nil
}

func (rule *noMagicNumbers) Boolean(name string) bool {
	value, _ := rule.Options()[name].(bool)
	return value
}

func (rule *noMagicNumbers) magicNumber(node *ast.Node) {
	full, parent := helpers.OuterParenthesizedNodeAndParent(node)
	sign := ""
	if parent != nil && parent.Kind == ast.KindPrefixUnaryExpression {
		operator := parent.AsPrefixUnaryExpression().Operator
		if operator == ast.KindPlusToken || operator == ast.KindMinusToken {
			full = parent
			if operator == ast.KindMinusToken {
				sign = "-"
			} else {
				sign = "+"
			}
		}
	}
	outer, parent := helpers.OuterParenthesizedNodeAndParent(full)
	if parent == nil {
		return
	}
	raw := sign + helpers.SourceNodeText(rule.context, node)
	value := float64(jsnum.FromString(node.Text()))
	if sign == "-" {
		value = -value
	}
	bigint := node.Kind == ast.KindBigIntLiteral
	var integer *big.Int
	if bigint {
		integer, _ = helpers.ParseBigIntLiteralValue(helpers.SourceNodeText(rule.context, node))
		if integer == nil {
			return
		}
		if sign == "-" {
			integer.Neg(integer)
		}
	}
	ignored, _ := rule.Options()["ignore"].([]any)
	for _, entry := range ignored {
		if bigint {
			if text, ok := entry.(string); ok {
				ignore, valid := helpers.ParseBigIntLiteralValue(text)
				if valid && integer.Cmp(ignore) == 0 {
					return
				}
			}
		} else if number, ok := entry.(float64); ok && number == value {
			return
		} else if number, ok := entry.(int); ok && float64(number) == value {
			return
		}
	}
	if rule.Boolean("ignoreArrayIndexes") && parent.Kind == ast.KindElementAccessExpression && parent.AsElementAccessExpression().ArgumentExpression == outer {
		if bigint && integer.Sign() >= 0 && integer.Cmp(big.NewInt(4294967295)) < 0 || !bigint && value >= 0 && value < 4294967295 && math.Trunc(value) == value {
			return
		}
	}
	if parent.Kind == ast.KindJsxExpression || parent.Kind == ast.KindJsxAttribute {
		return
	}
	if parent.Kind == ast.KindCallExpression && len(parent.Arguments()) > 1 && parent.Arguments()[1] == outer {
		callee := ast.SkipParentheses(parent.Expression())
		if callee.Kind == ast.KindIdentifier && callee.Text() == "parseInt" || ast.IsAccessExpression(callee) && helpers.StatementPropertyName(callee) == "parseInt" && ast.SkipParentheses(callee.Expression()).Kind == ast.KindIdentifier && ast.SkipParentheses(callee.Expression()).Text() == "Number" {
			return
		}
	}
	if rule.Boolean("ignoreDefaultValues") && ((parent.Kind == ast.KindParameter || parent.Kind == ast.KindBindingElement) && parent.Initializer() == outer || helpers.SourceAssignment(parent) && parent.AsBinaryExpression().Right == outer && helpers.SourceDestructuring(parent)) {
		return
	}
	if parent.Kind == ast.KindPropertyDeclaration && (rule.Boolean("ignoreClassFieldInitialValues") && parent.Initializer() == outer || rule.Boolean("ignoreReadonlyClassProperties") && ast.HasSyntacticModifier(parent, ast.ModifierFlagsReadonly)) {
		return
	}
	if rule.Boolean("ignoreEnums") && parent.Kind == ast.KindEnumMember {
		return
	}
	ancestor := parent
	if ancestor.Kind == ast.KindLiteralType {
		ancestor = ancestor.Parent
	}
	for ancestor != nil && (ancestor.Kind == ast.KindUnionType || ancestor.Kind == ast.KindIntersectionType || ancestor.Kind == ast.KindParenthesizedType) {
		ancestor = ancestor.Parent
	}
	if ancestor != nil && (rule.Boolean("ignoreNumericLiteralTypes") && ancestor.Kind == ast.KindTypeAliasDeclaration || rule.Boolean("ignoreTypeIndexes") && ancestor.Kind == ast.KindIndexedAccessType) {
		return
	}
	if parent.Kind == ast.KindVariableDeclaration {
		if rule.Boolean("enforceConst") && parent.Parent.Kind == ast.KindVariableDeclarationList && parent.Parent.Flags&ast.NodeFlagsConst == 0 {
			rule.context.Report(rule.context.Range(full), diagnostics.Number_constants_declarations_must_use_const)
		}
		return
	}
	property := parent
	if property.Kind == ast.KindComputedPropertyName {
		property = property.Parent
	}
	if !rule.Boolean("detectObjects") && (property.Kind == ast.KindPropertyAssignment || (property.Kind == ast.KindMethodDeclaration || property.Kind == ast.KindGetAccessor || property.Kind == ast.KindSetAccessor) && property.Parent.Kind == ast.KindObjectLiteralExpression || parent.Kind == ast.KindObjectLiteralExpression || helpers.SourceAssignment(parent) && ast.SkipParentheses(parent.AsBinaryExpression().Left).Kind != ast.KindIdentifier) {
		return
	}
	rule.context.Report(rule.context.Range(full), diagnostics.No_magic_number_Colon_0, raw)
}
