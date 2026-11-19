package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
)

type noUselessCatchRule struct {
	context Context
}

func newNoUselessCatch(context Context) Rule {
	rule := &noUselessCatchRule{
		context: context,
	}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindCatchClause},
	}
}

func (rule *noUselessCatchRule) OnEnterNode(node *ast.Node) bool {
	rule.checkCatch(node)
	return true
}

func (rule *noUselessCatchRule) checkCatch(node *ast.Node) {
	if node.Kind != ast.KindCatchClause {
		return
	}
	clause := node.AsCatchClause()
	if clause.VariableDeclaration == nil || clause.VariableDeclaration.Name().Kind != ast.KindIdentifier || len(clause.Block.AsBlock().Statements.Nodes) == 0 {
		return
	}
	first := clause.Block.AsBlock().Statements.Nodes[0]
	if first.Kind != ast.KindThrowStatement {
		return
	}
	expression := ast.SkipParentheses(first.Expression())
	if expression.Kind != ast.KindIdentifier || expression.Text() != clause.VariableDeclaration.Name().Text() {
		return
	}
	if node.Parent.AsTryStatement().FinallyBlock != nil {
		rule.context.Report(rule.context.Range(node), diagnostics.Unnecessary_catch_clause)
	} else {
		rule.context.Report(rule.context.Range(node.Parent), diagnostics.Unnecessary_try_Slashcatch_wrapper)
	}
}
