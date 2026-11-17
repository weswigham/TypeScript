package rules

import (
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/astnav"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type noUnexpectedMultilineCoreRule struct {
	context Context
}

func newNoUnexpectedMultilineCoreRule(context Context) *noUnexpectedMultilineCoreRule {
	return &noUnexpectedMultilineCoreRule{
		context: context,
	}
}

func (rule *noUnexpectedMultilineCoreRule) OnEnterNode(node *ast.Node) bool {
	rule.checkMultiline(node)
	return true
}

func (rule *noUnexpectedMultilineCoreRule) OnExitNode(node *ast.Node) {}

func (rule *noUnexpectedMultilineCoreRule) checkMultiline(node *ast.Node) {
	switch node.Kind {
	case ast.KindCallExpression:
		expression := node.AsCallExpression()
		if expression.QuestionDotToken == nil && len(expression.Arguments.Nodes) > 0 {
			start := expression.Arguments.Pos() - 1
			helpers.ReportAfterLineBreak(rule.context, start, start+1, diagnostics.Unexpected_newline_between_function_and_of_function_call)
		}
	case ast.KindElementAccessExpression:
		expression := node.AsElementAccessExpression()
		if expression.QuestionDotToken == nil {
			open := astnav.GetTokenAtPosition(rule.context.File, expression.Expression.End())
			start := scanner.GetTokenPosOfNode(open, rule.context.File, false)
			helpers.ReportAfterLineBreak(rule.context, start, start+1, diagnostics.Unexpected_newline_between_object_and_of_property_access)
		}
	case ast.KindTaggedTemplateExpression:
		template := node.AsTaggedTemplateExpression().Template
		start := scanner.GetTokenPosOfNode(template, rule.context.File, false)
		helpers.ReportAfterLineBreak(rule.context, start, start+1, diagnostics.Unexpected_newline_between_template_tag_and_template_literal)
	case ast.KindBinaryExpression:
		expression := node.AsBinaryExpression()
		left := ast.SkipParentheses(expression.Left)
		if expression.OperatorToken.Kind != ast.KindSlashToken || left.Kind != ast.KindBinaryExpression || left.AsBinaryExpression().OperatorToken.Kind != ast.KindSlashToken {
			return
		}
		flags := astnav.GetTokenAtPosition(rule.context.File, expression.OperatorToken.End())
		if flags.Kind != ast.KindIdentifier || scanner.GetTokenPosOfNode(flags, rule.context.File, false) != expression.OperatorToken.End() || flags.Text() == "" || strings.Trim(flags.Text(), "dgimsuvy") != "" {
			return
		}
		operator := left.AsBinaryExpression().OperatorToken
		start := scanner.GetTokenPosOfNode(operator, rule.context.File, false)
		helpers.ReportAfterLineBreak(rule.context, start, operator.End(), diagnostics.Unexpected_newline_between_numerator_and_division_operator)
	}
}

func newNoUnexpectedMultilineCore(context Context) Rule {
	return newNoUnexpectedMultilineCoreRule(context)
}
