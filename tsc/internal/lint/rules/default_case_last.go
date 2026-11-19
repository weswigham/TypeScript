package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
)

type defaultCaseLastRule struct {
	context Context
}

func newDefaultCaseLast(context Context) Rule {
	rule := &defaultCaseLastRule{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindCaseBlock},
	}
}

func (rule *defaultCaseLastRule) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindCaseBlock {
		clauses := node.AsCaseBlock().Clauses.Nodes
		for index, clause := range clauses {
			if clause.Kind == ast.KindDefaultClause && index != len(clauses)-1 {
				rule.context.Report(rule.context.Range(clause), diagnostics.Default_clause_should_be_the_last_clause)
				break
			}
		}
	}
	return true
}
