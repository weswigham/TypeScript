package rules

import (
	"slices"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/astnav"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type noDuplicateCase struct {
	context Context
}

func newNoDuplicateCase(context Context) Rule {
	rule := &noDuplicateCase{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindSwitchStatement},
	}
}

func (rule *noDuplicateCase) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindSwitchStatement {
		type previousCase struct {
			kind   ast.Kind
			tokens []expressionCaseToken
		}
		var previous []previousCase
		for _, clause := range node.AsSwitchStatement().CaseBlock.AsCaseBlock().Clauses.Nodes {
			if clause.Kind != ast.KindCaseClause {
				continue
			}
			expression := ast.SkipParentheses(clause.AsCaseOrDefaultClause().Expression)
			tokens := expressionCaseTokens(rule.context.File, expression)
			if slices.ContainsFunc(previous, func(test previousCase) bool {
				return test.kind == expression.Kind && slices.Equal(test.tokens, tokens)
			}) {
				rule.context.Report(rule.context.Range(clause), noDuplicateCaseMessage)
			} else {
				previous = append(previous, previousCase{kind: expression.Kind, tokens: tokens})
			}
		}
	}
	return true
}

var noDuplicateCaseMessage = diagnostics.Duplicate_case_label

type expressionCaseToken struct {
	kind ast.Kind
	text string
}

func expressionCaseTokens(file *ast.SourceFile, node *ast.Node) []expressionCaseToken {
	var result []expressionCaseToken
	for position := scanner.GetTokenPosOfNode(node, file, false); position < node.End(); {
		token := astnav.GetTokenAtPosition(file, position)
		if token.End() <= position {
			break
		}
		start := scanner.GetTokenPosOfNode(token, file, false)
		kind := token.Kind
		text := file.Text()[start:token.End()]
		if kind == ast.KindIdentifier {
			text = token.Text()
		}
		result = append(result, expressionCaseToken{kind: kind, text: text})
		position = token.End()
	}
	return result
}
