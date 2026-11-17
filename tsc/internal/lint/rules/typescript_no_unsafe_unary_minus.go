package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/checker"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type typescriptNoUnsafeUnaryMinusRule struct{ context Context }

func (rule *typescriptNoUnsafeUnaryMinusRule) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindPrefixUnaryExpression && node.AsPrefixUnaryExpression().Operator == ast.KindMinusToken {
		c := rule.context.GetChecker()
		typeValue := helpers.TypeSafetyConstrainedAt(c, node.AsPrefixUnaryExpression().Operand)
		for _, part := range helpers.TypeSafetyUnionParts(typeValue) {
			if part.Flags()&(checker.TypeFlagsAny|checker.TypeFlagsNever|checker.TypeFlagsBigIntLike|checker.TypeFlagsNumberLike) == 0 {
				rule.context.Report(rule.context.Range(node), diagnostics.Argument_of_unary_negation_should_be_assignable_to_number_bigint_but_is_0_instead, c.TypeToString(typeValue))
				break
			}
		}
	}
	return true
}

func (rule *typescriptNoUnsafeUnaryMinusRule) OnExitNode(node *ast.Node) {}

func newTypeScriptNoUnsafeUnaryMinus(context Context) Rule {
	return &typescriptNoUnsafeUnaryMinusRule{context: context}
}
