package rules

import (
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/ls/change"
)

type arrowBodyStyleRule struct {
	context Context
}

func (rule *arrowBodyStyleRule) OnEnterNode(node *ast.Node) bool {
	if node.Kind != ast.KindArrowFunction {
		return true
	}
	body := node.Body()
	mode := helpers.StringOptionValue(helpers.SyntaxOption(rule.context, 0), "as-needed")
	requireObject := helpers.BooleanOptionValue(helpers.SyntaxObject(rule.context, 1), "requireReturnForObjectLiteral", false)
	if body.Kind != ast.KindBlock {
		if mode == "always" || mode == "as-needed" && requireObject && ast.SkipParentheses(body).Kind == ast.KindObjectLiteralExpression {
			diagnostic := rule.context.Report(rule.context.Range(body), diagnostics.Expected_block_statement_surrounding_arrow_body)
			helpers.SyntaxFix(rule.context, "arrow-body-style", diagnostic, body, func(tracker *change.Tracker) *ast.Node {
				return tracker.NewBlock(tracker.NewNodeList([]*ast.Node{tracker.NewReturnStatement(body)}), true)
			})
		}
		return true
	}
	statements := body.Statements()
	if mode == "always" || mode != "never" && (len(statements) != 1 || statements[0].Kind != ast.KindReturnStatement) {
		return true
	}
	var expression *ast.Node
	if len(statements) == 1 && statements[0].Kind == ast.KindReturnStatement {
		expression = statements[0].Expression()
	}
	if mode == "as-needed" && requireObject && expression != nil && ast.SkipParentheses(expression).Kind == ast.KindObjectLiteralExpression {
		return true
	}
	message := diagnostics.Unexpected_block_statement_surrounding_arrow_body
	if len(statements) == 0 {
		message = diagnostics.Unexpected_block_statement_surrounding_arrow_body_put_a_value_of_undefined_immediately_after_the
	} else if len(statements) == 1 && statements[0].Kind == ast.KindReturnStatement {
		message = diagnostics.Unexpected_block_statement_surrounding_arrow_body_move_the_returned_value_immediately_after_the
		if expression != nil && expression.Kind == ast.KindObjectLiteralExpression {
			message = diagnostics.Unexpected_block_statement_surrounding_arrow_body_parenthesize_the_returned_value_and_move_it_immediately_after_the
		}
	}
	diagnostic := rule.context.Report(rule.context.Range(body), message)
	if expression != nil {
		tail := strings.TrimLeft(rule.context.File.Text()[body.End():], " \t\r\n")
		if tail != "" && strings.ContainsRune("([/`+-", rune(tail[0])) {
			return true
		}
		helpers.SyntaxFix(rule.context, "arrow-body-style", diagnostic, body, func(tracker *change.Tracker) *ast.Node {
			return tracker.NewParenthesizedExpression(expression)
		})
	}
	return true
}

func (rule *arrowBodyStyleRule) OnExitNode(node *ast.Node) {
}

func newArrowBodyStyle(context Context) Rule {
	return &arrowBodyStyleRule{context: context}
}
