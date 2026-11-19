package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
)

type typescriptNoDynamicDeleteRule struct {
	context Context
}

func newTypeScriptNoDynamicDelete(context Context) Rule {
	rule := &typescriptNoDynamicDeleteRule{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindDeleteExpression},
	}
}

func (rule *typescriptNoDynamicDeleteRule) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindDeleteExpression {
		argument := ast.SkipParentheses(node.Expression())
		if argument.Kind == ast.KindElementAccessExpression {
			key := ast.SkipParentheses(argument.AsElementAccessExpression().ArgumentExpression)
			literal := key.Kind == ast.KindStringLiteral || key.Kind == ast.KindNumericLiteral
			negative := key.Kind == ast.KindPrefixUnaryExpression && key.AsPrefixUnaryExpression().Operator == ast.KindMinusToken && ast.SkipParentheses(key.AsPrefixUnaryExpression().Operand).Kind == ast.KindNumericLiteral
			if !literal && !negative {
				rule.context.Report(rule.context.Range(key), diagnostics.Do_not_delete_dynamically_computed_property_keys)
			}
		}
	}
	return true
}
