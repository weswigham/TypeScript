package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type funcNameMatchingRule struct {
	context Context
}

func (rule *funcNameMatchingRule) OnEnterNode(node *ast.Node) bool {
	if node.Kind != ast.KindFunctionExpression || node.Name() == nil {
		return true
	}
	expression := node
	for expression.Parent != nil && expression.Parent.Kind == ast.KindParenthesizedExpression {
		expression = expression.Parent
	}
	parent := expression.Parent
	name, property := "", false
	options := helpers.SyntaxObject(rule.context, 1)
	if helpers.SyntaxObject(rule.context, 0) != nil {
		options = helpers.SyntaxObject(rule.context, 0)
	}
	switch parent.Kind {
	case ast.KindVariableDeclaration:
		if parent.Initializer() == expression && parent.Name().Kind == ast.KindIdentifier {
			name = parent.Name().Text()
		}
	case ast.KindBinaryExpression:
		binary := parent.AsBinaryExpression()
		if binary.Right != expression || !ast.IsAssignmentOperator(binary.OperatorToken.Kind) {
			return true
		}
		left := ast.SkipParentheses(binary.Left)
		if left.Kind == ast.KindIdentifier {
			name = left.Text()
		} else if ast.IsAccessExpression(left) {
			if left.Kind == ast.KindElementAccessExpression {
				argument := ast.SkipParentheses(left.AsElementAccessExpression().ArgumentExpression)
				if argument == nil || argument.Kind != ast.KindStringLiteral && argument.Kind != ast.KindNumericLiteral {
					return true
				}
			}
			name, property = helpers.AccessPropertyNameText(left), true
			if name == "exports" && left.Expression().Kind == ast.KindIdentifier && left.Expression().Text() == "module" && !helpers.BooleanOptionValue(options, "includeCommonJSModuleExports", false) {
				return true
			}
		}
		if !scanner.IsIdentifierText(name, core.LanguageVariantStandard) {
			return true
		}
	case ast.KindPropertyAssignment, ast.KindPropertyDeclaration:
		if parent.Initializer() != expression {
			return true
		}
		var valid bool
		name, valid = funcNameMatchingIdentifierName(parent.Name())
		if !valid {
			return true
		}
		property = true
		if helpers.BooleanOptionValue(options, "considerPropertyDescriptor", false) && name == "value" && helpers.IsPropertyDescriptorObject(parent.Parent) {
			descriptor := parent.Parent.Parent
			if descriptor.Kind == ast.KindCallExpression {
				key := descriptor.Arguments()[1]
				if key.Kind != ast.KindStringLiteral {
					return true
				}
				name, valid = funcNameMatchingIdentifierName(key)
			} else {
				name, valid = funcNameMatchingIdentifierName(descriptor.Name())
			}
			if !valid {
				return true
			}
		}
	default:
		return true
	}
	if name == "" {
		return true
	}
	functionName := node.Name().Text()
	mode := helpers.StringOptionValue(helpers.SyntaxOption(rule.context, 0), "always")
	if mode == "always" && name == functionName || mode == "never" && name != functionName {
		return true
	}
	kind := "variable"
	if property {
		kind = "property"
	}
	verb := "match"
	if mode == "never" {
		verb = "not match"
	}
	rule.context.Report(rule.context.Range(parent), diagnostics.Function_name_0_should_1_2_name_3, functionName, verb, kind, name)
	return true
}

func (rule *funcNameMatchingRule) OnExitNode(node *ast.Node) {
}

func funcNameMatchingIdentifierName(name *ast.Node) (string, bool) {
	if name == nil {
		return "", false
	}
	if name.Kind == ast.KindComputedPropertyName {
		name = ast.SkipParentheses(name.Expression())
		if name.Kind != ast.KindStringLiteral {
			return "", false
		}
	}
	if name.Kind != ast.KindIdentifier && name.Kind != ast.KindStringLiteral {
		return "", false
	}
	text := name.Text()
	return text, scanner.IsIdentifierText(text, core.LanguageVariantStandard) && !(scanner.StringToToken(text) >= ast.KindFirstKeyword && scanner.StringToToken(text) <= ast.KindLastReservedWord)
}

func newFuncNameMatching(context Context) Rule {
	return &funcNameMatchingRule{context: context}
}
