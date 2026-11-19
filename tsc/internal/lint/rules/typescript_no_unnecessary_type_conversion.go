package rules

import (
	"math"
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/checker"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/jsnum"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type typescriptNoUnnecessaryTypeConversionRule struct {
	helpers.DiagnosticSuggestions
	context Context
}

func newTypeScriptNoUnnecessaryTypeConversion(context Context) Rule {
	rule := &typescriptNoUnnecessaryTypeConversionRule{context: context}

	return Rule{
		Enter:          rule.OnEnterNode,
		EnterKinds:     []ast.Kind{ast.KindCallExpression, ast.KindBinaryExpression, ast.KindPrefixUnaryExpression},
		GetSuggestions: rule.Suggestions,
	}
}

func (rule *typescriptNoUnnecessaryTypeConversionRule) OnEnterNode(node *ast.Node) bool {
	c := rule.context.GetChecker()
	switch node.Kind {
	case ast.KindCallExpression:
		callee := ast.SkipParentheses(node.Expression())
		arguments := node.Arguments()
		if callee.Kind == ast.KindIdentifier && len(arguments) > 0 && arguments[0].Kind != ast.KindSpreadElement {
			flags := map[string]checker.TypeFlags{"String": checker.TypeFlagsStringLike, "Number": checker.TypeFlagsNumberLike, "Boolean": checker.TypeFlagsBooleanLike, "BigInt": checker.TypeFlagsBigIntLike}[callee.Text()]
			if flags != 0 && helpers.StatementBuiltin(rule.context, callee, true) && typeSafetyAssertionAll(helpers.TypeSafetyConstrainedAt(c, arguments[0]), flags) {
				typeName := strings.ToLower(callee.Text())
				rule.report(node, arguments[0], callee, typeName, "Passing a "+typeName+" to "+callee.Text()+"()", -1, -1)
			}
		} else if callee.Kind == ast.KindPropertyAccessExpression && callee.Name().Text() == "toString" {
			typeValue := helpers.TypeSafetyConstrainedAt(c, callee.Expression())
			if typeValue.Flags()&checker.TypeFlagsEnumLike == 0 && (typeValue.Symbol() == nil || typeValue.Symbol().Flags()&ast.SymbolFlagsEnumMember == 0) && typeSafetyAssertionAll(typeValue, checker.TypeFlagsStringLike) {
				rule.report(node, callee.Expression(), callee.Name(), "string", "Calling a string's .toString() method", scanner.GetTokenPosOfNode(callee.Name(), rule.context.File, false), node.End())
			}
		}
	case ast.KindBinaryExpression:
		binary := node.AsBinaryExpression()
		if binary.OperatorToken.Kind != ast.KindPlusToken && binary.OperatorToken.Kind != ast.KindPlusEqualsToken {
			break
		}
		right, left := ast.SkipParentheses(binary.Right), ast.SkipParentheses(binary.Left)
		if right.Kind == ast.KindStringLiteral && right.Text() == "" && typeSafetyAssertionAll(c.GetTypeAtLocation(binary.Left), checker.TypeFlagsStringLike) {
			start := binary.Left.End()
			if binary.OperatorToken.Kind == ast.KindPlusEqualsToken {
				start = scanner.GetTokenPosOfNode(node, rule.context.File, false)
			}
			rule.report(node, binary.Left, node, "string", "Concatenating a string with ''", start, node.End())
		} else if binary.OperatorToken.Kind == ast.KindPlusToken && left.Kind == ast.KindStringLiteral && left.Text() == "" && typeSafetyAssertionAll(c.GetTypeAtLocation(binary.Right), checker.TypeFlagsStringLike) {
			rule.report(node, binary.Right, node, "string", "Concatenating '' with a string", scanner.GetTokenPosOfNode(node, rule.context.File, false), scanner.GetTokenPosOfNode(binary.Right, rule.context.File, false))
		}
	case ast.KindPrefixUnaryExpression:
		unary := node.AsPrefixUnaryExpression()
		if unary.Operator == ast.KindPlusToken && typeSafetyAssertionAll(c.GetTypeAtLocation(unary.Operand), checker.TypeFlagsNumberLike) {
			start := scanner.GetTokenPosOfNode(node, rule.context.File, false)
			rule.report(node, unary.Operand, node, "number", "Using the unary + operator on a number", start, start+1)
		} else if (unary.Operator == ast.KindExclamationToken || unary.Operator == ast.KindTildeToken) && node.Parent.Kind == ast.KindPrefixUnaryExpression && node.Parent.AsPrefixUnaryExpression().Operator == unary.Operator {
			typeValue := c.GetTypeAtLocation(unary.Operand)
			typeName, violation, valid := "boolean", "Using !! on a boolean", typeSafetyAssertionAll(typeValue, checker.TypeFlagsBooleanLike)
			if unary.Operator == ast.KindTildeToken {
				typeName, violation, valid = "number", "Using ~~ on an integer", true
				for _, part := range helpers.TypeSafetyUnionParts(typeValue) {
					if part.Flags()&checker.TypeFlagsNumberLiteral == 0 {
						valid = false
						break
					}
					value := float64(part.AsLiteralType().Value().(jsnum.Number))
					if math.Trunc(value) != value {
						valid = false
						break
					}
				}
			}
			if valid {
				rule.report(node.Parent, unary.Operand, node.Parent, typeName, violation, scanner.GetTokenPosOfNode(node.Parent, rule.context.File, false), scanner.GetTokenPosOfNode(node, rule.context.File, false)+1)
			}
		}
	}
	return true
}

func (rule *typescriptNoUnnecessaryTypeConversionRule) report(node, inner, reporting *ast.Node, typeName, violation string, start, end int) {
	diagnosticLocation := rule.context.Range(reporting)
	if start >= 0 {
		diagnosticLocation = core.NewTextRange(start, end)
	}
	diagnostic := rule.context.Report(diagnosticLocation, diagnostics.X_0_does_not_change_the_type_or_value_of_the_1, violation, typeName)

	if rule.context.NewTracker == nil {
		return
	}
	text := typeSafetyAssertionText(rule.context, inner)
	if ast.GetExpressionPrecedence(inner) < ast.OperatorPrecedenceAssignment {
		text = "(" + text + ")"
	}
	for index := range 2 {
		tracker := rule.context.NewTracker()
		replacement := text
		description := ast.NewCompilerDiagnostic(diagnostics.Remove_the_type_conversion)
		if index == 1 {
			if ast.GetExpressionPrecedence(inner) <= ast.OperatorPrecedenceRelational {
				replacement = "(" + typeSafetyAssertionText(rule.context, inner) + ")"
			}
			replacement += " satisfies " + typeName
			description = ast.NewCompilerDiagnostic(diagnostics.Instead_assert_that_the_value_satisfies_the_0_type, typeName)
		}
		if index == 0 && node.Kind == ast.KindBinaryExpression && node.AsBinaryExpression().OperatorToken.Kind == ast.KindPlusEqualsToken && node.Parent.Kind == ast.KindExpressionStatement {
			tracker.DeleteRange(rule.context.File, core.NewTextRange(scanner.GetTokenPosOfNode(node.Parent, rule.context.File, false), node.Parent.End()))
		} else {
			tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(scanner.GetTokenPosOfNode(node, rule.context.File, false), node.End()), replacement)
		}
		rule.AddSuggestion(diagnostic, "@typescript-eslint/no-unnecessary-type-conversion", tracker.GetTextChanges(), description)
	}
}

func typeSafetyAssertionAll(typeValue *checker.Type, flags checker.TypeFlags) bool {
	for _, part := range helpers.TypeSafetyUnionParts(typeValue) {
		if helpers.TypeSafetyAssertionFlags(part)&flags == 0 {
			return false
		}
	}
	return true
}

func typeSafetyAssertionText(context Context, node *ast.Node) string {
	return context.File.Text()[scanner.GetTokenPosOfNode(node, context.File, false):node.End()]
}
