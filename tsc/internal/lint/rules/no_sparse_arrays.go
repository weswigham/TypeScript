package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/astnav"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type noSparseArrays struct {
	context Context
}

func newNoSparseArrays(context Context) Rule {
	rule := &noSparseArrays{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindArrayLiteralExpression},
	}
}

func (rule *noSparseArrays) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindArrayLiteralExpression && !helpers.IsDestructuringAssignmentPattern(node) {
		for _, element := range node.AsArrayLiteralExpression().Elements.Nodes {
			if element.Kind == ast.KindOmittedExpression {
				token := astnav.GetTokenAtPosition(rule.context.File, element.End())
				if token.Kind == ast.KindCommaToken {
					rule.context.Report(rule.context.Range(token), diagnostics.Unexpected_comma_in_middle_of_array)
				}
			}
		}
	}
	return true
}
