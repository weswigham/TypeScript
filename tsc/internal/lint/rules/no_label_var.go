package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
)

type noLabelVarRule struct{ context Context }

func newNoLabelVarRule(context Context) Rule {
	rule := &noLabelVarRule{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindLabeledStatement},
	}
}

func (rule *noLabelVarRule) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindLabeledStatement {
		label := node.AsLabeledStatement().Label
		if rule.context.GetChecker().ResolveName(label.Text(), node, ast.SymbolFlagsValue, false) != nil {
			rule.context.Report(rule.context.Range(node), diagnostics.Found_identifier_with_same_name_as_label)
		}
	}
	return true
}
