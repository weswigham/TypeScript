package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type eqeqeqRule struct {
	context Context
}

func (rule *eqeqeqRule) OnEnterNode(node *ast.Node) bool {
	if node.Kind != ast.KindBinaryExpression {
		return true
	}
	binary := node.AsBinaryExpression()
	left, right := ast.SkipParentheses(binary.Left), ast.SkipParentheses(binary.Right)
	operator := binary.OperatorToken.Kind
	mode := helpers.StringOptionValue(helpers.SyntaxOption(rule.context, 0), "always")
	nullOption := helpers.StringOptionValue(helpers.SyntaxObject(rule.context, 1)["null"], "always")
	if mode != "always" {
		nullOption = "ignore"
	}
	isNull := left.Kind == ast.KindNullKeyword || right.Kind == ast.KindNullKeyword
	safe := left.Kind == ast.KindTypeOfExpression || right.Kind == ast.KindTypeOfExpression || eqeqeqLiteralType(left) != "" && eqeqeqLiteralType(left) == eqeqeqLiteralType(right)
	expected, actual := "", ""
	switch operator {
	case ast.KindEqualsEqualsToken, ast.KindExclamationEqualsToken:
		if isNull && nullOption != "always" || mode == "smart" && safe {
			return true
		}
		if operator == ast.KindEqualsEqualsToken {
			actual, expected = "==", "==="
		} else {
			actual, expected = "!=", "!=="
		}
	case ast.KindEqualsEqualsEqualsToken, ast.KindExclamationEqualsEqualsToken:
		if !isNull || nullOption != "never" {
			return true
		}
		if operator == ast.KindEqualsEqualsEqualsToken {
			actual, expected = "===", "=="
		} else {
			actual, expected = "!==", "!="
		}
	default:
		return true
	}
	diagnostic := rule.context.Report(rule.context.Range(binary.OperatorToken), diagnostics.Expected_0_and_instead_saw_1, expected, actual)
	if safe && rule.context.NewTracker != nil {
		tracker := rule.context.NewTracker()
		tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(scanner.GetTokenPosOfNode(binary.OperatorToken, rule.context.File, false), binary.OperatorToken.End()), expected)
		diagnostic.SetCodeFixes(codefix.CreateCodeFixAction("eqeqeq", tracker.GetTextChanges(), ast.NewCompilerDiagnostic(diagnostics.Fix_0, "eqeqeq"), "eqeqeq", ast.NewCompilerDiagnostic(diagnostics.Fix_all_0, "eqeqeq")))
	}
	return true
}

func (rule *eqeqeqRule) OnExitNode(node *ast.Node) {
}

func eqeqeqLiteralType(node *ast.Node) string {
	switch node.Kind {
	case ast.KindStringLiteral, ast.KindNoSubstitutionTemplateLiteral:
		return "string"
	case ast.KindNumericLiteral:
		return "number"
	case ast.KindTrueKeyword, ast.KindFalseKeyword:
		return "boolean"
	case ast.KindBigIntLiteral:
		return "bigint"
	case ast.KindNullKeyword, ast.KindRegularExpressionLiteral:
		return "object"
	}
	return ""
}

func newEqeqeq(context Context) Rule {
	return &eqeqeqRule{context: context}
}
