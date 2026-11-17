package rules

import (
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/astnav"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/jsnum"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type preferNumericLiteralsCoreRule struct {
	context Context
}

func newPreferNumericLiteralsCoreRule(context Context) *preferNumericLiteralsCoreRule {
	return &preferNumericLiteralsCoreRule{
		context: context,
	}
}

func (rule *preferNumericLiteralsCoreRule) OnEnterNode(node *ast.Node) bool {
	rule.checkNumeric(node)
	return true
}

func (rule *preferNumericLiteralsCoreRule) OnExitNode(node *ast.Node) {}

func (rule *preferNumericLiteralsCoreRule) checkNumeric(node *ast.Node) {
	if node.Kind != ast.KindCallExpression || len(node.AsCallExpression().Arguments.Nodes) != 2 {
		return
	}
	callee := ast.SkipParentheses(node.Expression())
	global := callee
	if ast.IsAccessExpression(callee) && helpers.StatementPropertyName(callee) == "parseInt" {
		global = ast.SkipParentheses(callee.Expression())
		if global.Kind != ast.KindIdentifier || global.Text() != "Number" {
			return
		}
	} else if callee.Kind != ast.KindIdentifier || callee.Text() != "parseInt" {
		return
	}
	arguments := node.AsCallExpression().Arguments.Nodes
	value, radix := ast.SkipParentheses(arguments[0]), ast.SkipParentheses(arguments[1])
	if (value.Kind != ast.KindStringLiteral && value.Kind != ast.KindNoSubstitutionTemplateLiteral) || radix.Kind != ast.KindNumericLiteral {
		return
	}
	var system, prefix, digits string
	switch jsnum.FromString(radix.Text()) {
	case 2:
		system, prefix, digits = "binary", "0b", "01"
	case 8:
		system, prefix, digits = "octal", "0o", "01234567"
	case 16:
		system, prefix, digits = "hexadecimal", "0x", "0123456789abcdefABCDEF"
	default:
		return
	}
	if !expressionGlobalReference(rule.context, global) {
		return
	}
	calleeStart := scanner.GetTokenPosOfNode(callee, rule.context.File, false)
	diagnostic := rule.context.Report(rule.context.Range(node), diagnostics.Use_0_literals_instead_of_1, system, rule.context.File.Text()[calleeStart:callee.End()])
	valueText := strings.TrimRightFunc(value.Text(), helpers.IsECMAScriptWhitespace)
	if valueText == "" || strings.Trim(valueText, digits) != "" {
		return
	}
	start := scanner.GetTokenPosOfNode(node, rule.context.File, false)
	if helpers.HasSourceCommentBetween(rule.context, start, node.End()) {
		return
	}
	replacement := prefix + value.Text()
	previous := astnav.FindPrecedingToken(rule.context.File, start)
	if previous != nil && previous.End() == start && (previous.Kind == ast.KindIdentifier || ast.IsKeywordKind(previous.Kind) || previous.Kind == ast.KindNumericLiteral || previous.Kind == ast.KindRegularExpressionLiteral) {
		replacement = " " + replacement
	}
	next := astnav.GetTokenAtPosition(rule.context.File, node.End())
	if next.Kind != ast.KindEndOfFile && scanner.GetTokenPosOfNode(next, rule.context.File, false) == node.End() && (next.Kind == ast.KindIdentifier || ast.IsKeywordKind(next.Kind) || next.Kind == ast.KindNumericLiteral) {
		replacement += " "
	}
	rule.fixRange(diagnostic, start, node.End(), replacement)
}

func (rule *preferNumericLiteralsCoreRule) fixRange(diagnostic *ast.Diagnostic, start int, end int, replacement string) {
	if rule.context.NewTracker == nil {
		return
	}
	tracker := rule.context.NewTracker()
	tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(start, end), replacement)
	diagnostic.SetCodeFixes(codefix.CreateCodeFixAction("prefer-numeric-literals", tracker.GetTextChanges(), ast.NewCompilerDiagnostic(diagnostics.Fix_0, "prefer-numeric-literals"), "prefer-numeric-literals", ast.NewCompilerDiagnostic(diagnostics.Fix_all_0, "prefer-numeric-literals")))
}

func newPreferNumericLiteralsCore(context Context) Rule {
	return newPreferNumericLiteralsCoreRule(context)
}
