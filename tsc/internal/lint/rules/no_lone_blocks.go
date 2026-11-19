package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type noLoneBlocksRule struct{ context Context }

func newNoLoneBlocksRule(context Context) Rule {
	rule := &noLoneBlocksRule{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindBlock},
	}
}

func (rule *noLoneBlocksRule) OnEnterNode(node *ast.Node) bool {
	rule.checkLoneBlock(node)
	return true
}

func noLoneBlocksStatementList(node *ast.Node) []*ast.Node {
	switch node.Kind {
	case ast.KindSourceFile:
		return node.AsSourceFile().Statements.Nodes
	case ast.KindBlock:
		return node.AsBlock().Statements.Nodes
	case ast.KindCaseClause, ast.KindDefaultClause:
		return node.AsCaseOrDefaultClause().Statements.Nodes
	}
	return nil
}

func (rule *noLoneBlocksRule) checkLoneBlock(node *ast.Node) {
	if node.Kind != ast.KindBlock || node.Parent == nil || node.Parent.Kind == ast.KindClassStaticBlockDeclaration {
		return
	}
	parent := node.Parent
	if parent.Kind != ast.KindSourceFile && parent.Kind != ast.KindBlock && parent.Kind != ast.KindCaseClause && parent.Kind != ast.KindDefaultClause {
		return
	}
	statements := noLoneBlocksStatementList(parent)
	if (parent.Kind == ast.KindCaseClause || parent.Kind == ast.KindDefaultClause) && len(statements) == 1 {
		return
	}
	lexical := false
	for _, statement := range node.AsBlock().Statements.Nodes {
		if statement.Kind == ast.KindVariableStatement && statement.AsVariableStatement().DeclarationList.Flags&ast.NodeFlagsBlockScoped != 0 || statement.Kind == ast.KindClassDeclaration || statement.Kind == ast.KindFunctionDeclaration && helpers.SharedScopeStrict(node) {
			lexical = true
		}
	}
	if lexical && !(parent.Kind == ast.KindBlock && len(statements) == 1) {
		return
	}
	if parent.Kind == ast.KindBlock {
		rule.context.Report(rule.context.Range(node), diagnostics.Nested_block_is_redundant)
	} else {
		rule.context.Report(rule.context.Range(node), diagnostics.Block_is_redundant)
	}
}
