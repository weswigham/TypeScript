package rules

import (
	"math"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/jsnum"
)

var tsDuplicateEnumValue = diagnostics.Duplicate_enum_member_value_0

type typescriptNoDuplicateEnumValuesRule struct {
	context Context
}

type tsEnumValue struct {
	text     string
	number   uint64
	isNumber bool
}

func tsEnumLiteralValue(node *ast.Node) (tsEnumValue, bool) {
	if node == nil {
		return tsEnumValue{}, false
	}
	node = ast.SkipParentheses(node)
	switch node.Kind {
	case ast.KindStringLiteral, ast.KindNoSubstitutionTemplateLiteral:
		if node.Flags&ast.NodeFlagsThisNodeHasError != 0 {
			return tsEnumValue{}, false
		}
		return tsEnumValue{text: node.Text()}, true
	case ast.KindNumericLiteral:
		return tsEnumValue{number: math.Float64bits(float64(jsnum.FromString(node.Text()))), isNumber: true}, true
	case ast.KindPrefixUnaryExpression:
		unary := node.AsPrefixUnaryExpression()
		if unary.Operator != ast.KindPlusToken && unary.Operator != ast.KindMinusToken {
			return tsEnumValue{}, false
		}
		value, ok := tsEnumLiteralValue(unary.Operand)
		if !ok {
			return tsEnumValue{}, false
		}
		number := math.Float64frombits(value.number)
		if !value.isNumber {
			number = float64(jsnum.FromString(value.text))
		}
		if math.IsNaN(number) {
			return tsEnumValue{}, false
		}
		if unary.Operator == ast.KindMinusToken {
			number = -number
		}
		return tsEnumValue{number: math.Float64bits(number), isNumber: true}, true
	}
	return tsEnumValue{}, false
}

func (rule *typescriptNoDuplicateEnumValuesRule) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindEnumDeclaration {
		seen := make(map[tsEnumValue]bool)
		for _, member := range node.Members() {
			value, ok := tsEnumLiteralValue(member.Initializer())
			if !ok {
				continue
			}
			if seen[value] {
				text := value.text
				if value.isNumber {
					text = jsnum.Number(math.Float64frombits(value.number)).String()
				}
				rule.context.Report(rule.context.Range(member), tsDuplicateEnumValue, text)
			}
			seen[value] = true
		}
	}
	return true
}

func (rule *typescriptNoDuplicateEnumValuesRule) OnExitNode(node *ast.Node) {}

func newTypeScriptNoDuplicateEnumValues(context Context) Rule {
	return &typescriptNoDuplicateEnumValuesRule{context: context}
}
