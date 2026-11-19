package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type noMultiAssign struct {
	context Context
}

func newNoMultiAssign(context Context) Rule {
	rule := &noMultiAssign{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindBinaryExpression},
	}
}

func (rule *noMultiAssign) OnEnterNode(node *ast.Node) bool {
	if helpers.SourceAssignment(node) {
		outer, parent := helpers.OuterParenthesizedNodeAndParent(node)
		if parent != nil && ((parent.Kind == ast.KindVariableDeclaration || parent.Kind == ast.KindPropertyDeclaration) && parent.Initializer() == outer || !rule.Boolean("ignoreNonDeclaration") && helpers.SourceAssignment(parent) && parent.AsBinaryExpression().Right == outer) {
			rule.context.Report(rule.context.Range(node), diagnostics.Unexpected_chained_assignment)
		}
	}

	return true
}

func (rule *noMultiAssign) Options() map[string]any {
	if len(rule.context.Options) > 0 {
		options, _ := rule.context.Options[0].(map[string]any)
		return options
	}
	return nil
}

func (rule *noMultiAssign) Boolean(name string) bool {
	value, _ := rule.Options()[name].(bool)
	return value
}
