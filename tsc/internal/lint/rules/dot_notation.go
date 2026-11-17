package rules

import (
	"regexp"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/ls/change"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type dotNotationRule struct {
	context Context
}

func (rule *dotNotationRule) OnEnterNode(node *ast.Node) bool {
	options := helpers.SyntaxObject(rule.context, 0)
	allowKeywords := helpers.BooleanOptionValue(options, "allowKeywords", true)
	if node.Kind == ast.KindElementAccessExpression {
		access := node.AsElementAccessExpression()
		property := ast.SkipParentheses(access.ArgumentExpression)
		if property == nil {
			return true
		}
		name := ""
		switch property.Kind {
		case ast.KindStringLiteral, ast.KindNoSubstitutionTemplateLiteral:
			name = property.Text()
		case ast.KindTrueKeyword:
			name = "true"
		case ast.KindFalseKeyword:
			name = "false"
		case ast.KindNullKeyword:
			name = "null"
		default:
			return true
		}
		keyword := scanner.StringToToken(name) >= ast.KindFirstKeyword && scanner.StringToToken(name) <= ast.KindLastReservedWord
		if !dotNotationIdentifier.MatchString(name) || !allowKeywords && keyword || options["allowPattern"] != nil && helpers.MatchesRegularExpression(helpers.StringOptionValue(options["allowPattern"], ""), name) {
			return true
		}
		formatted := "\"" + name + "\""
		if property.Kind == ast.KindNoSubstitutionTemplateLiteral {
			formatted = "`" + name + "`"
		} else if property.Kind != ast.KindStringLiteral {
			formatted = name
		}
		diagnostic := rule.context.Report(rule.context.Range(property), diagnostics.X_0_is_better_written_in_dot_notation, formatted)
		if len(helpers.SyntaxComments(rule.context, access.Expression.End(), node.End())) == 0 {
			helpers.SyntaxFix(rule.context, "dot-notation", diagnostic, node, func(tracker *change.Tracker) *ast.Node {
				return tracker.NewPropertyAccessExpression(access.Expression, access.QuestionDotToken, tracker.NewIdentifier(name), node.Flags)
			})
		}
	} else if !allowKeywords && node.Kind == ast.KindPropertyAccessExpression {
		access := node.AsPropertyAccessExpression()
		name := access.Name().Text()
		keyword := scanner.StringToToken(name)
		if keyword < ast.KindFirstKeyword || keyword > ast.KindLastReservedWord {
			return true
		}
		diagnostic := rule.context.Report(rule.context.Range(access.Name()), diagnostics.X_0_is_a_syntax_error, name)
		if access.Expression.Kind == ast.KindIdentifier && access.Expression.Text() == "let" && access.QuestionDotToken == nil {
			return true
		}
		if len(helpers.SyntaxComments(rule.context, access.Expression.End(), node.End())) == 0 {
			helpers.SyntaxFix(rule.context, "dot-notation", diagnostic, node, func(tracker *change.Tracker) *ast.Node {
				return tracker.NewElementAccessExpression(access.Expression, access.QuestionDotToken, tracker.NewStringLiteral(name, ast.TokenFlagsNone), node.Flags)
			})
		}
	}
	return true
}

func (rule *dotNotationRule) OnExitNode(node *ast.Node) {
}

var dotNotationIdentifier = regexp.MustCompile(`^[a-zA-Z_$][a-zA-Z0-9_$]*$`)

func newDotNotation(context Context) Rule {
	return &dotNotationRule{context: context}
}
