package rules

import (
	"slices"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/astnav"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type noSelfCompare struct {
	context Context
}

func newNoSelfCompare(context Context) Rule {
	rule := &noSelfCompare{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindBinaryExpression},
	}
}

func (rule *noSelfCompare) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindBinaryExpression {
		expression := node.AsBinaryExpression()
		switch expression.OperatorToken.Kind {
		case ast.KindEqualsEqualsToken, ast.KindEqualsEqualsEqualsToken, ast.KindExclamationEqualsToken, ast.KindExclamationEqualsEqualsToken,
			ast.KindLessThanToken, ast.KindGreaterThanToken, ast.KindLessThanEqualsToken, ast.KindGreaterThanEqualsToken:
			if slices.Equal(noSelfCompareTokens(rule.context, ast.SkipParentheses(expression.Left)), noSelfCompareTokens(rule.context, ast.SkipParentheses(expression.Right))) {
				rule.context.Report(rule.context.Range(node), diagnostics.Comparing_to_itself_is_potentially_pointless)
			}
		}
	}
	return true
}

func noSelfCompareTokens(context Context, node *ast.Node) []noSelfCompareToken {
	var result []noSelfCompareToken
	for position := helpers.RuleTokenStart(context, node); position < node.End(); {
		token := astnav.GetTokenAtPosition(context.File, position)
		if token.End() <= position {
			break
		}
		text := context.File.Text()[helpers.RuleTokenStart(context, token):token.End()]
		if token.Kind == ast.KindIdentifier || token.Kind == ast.KindPrivateIdentifier {
			text = token.Text()
		}
		result = append(result, noSelfCompareToken{kind: token.Kind, text: text})
		position = token.End()
	}
	return result
}

type noSelfCompareToken struct {
	kind ast.Kind
	text string
}
