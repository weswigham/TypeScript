package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type noEmpty struct {
	context Context
}

func newNoEmpty(context Context) Rule {
	rule := &noEmpty{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindBlock, ast.KindCaseBlock},
	}
}

func (rule *noEmpty) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindBlock && helpers.IsEmptyCommentFreeBlock(rule.context, node) && !ast.IsFunctionLike(node.Parent) && node.Parent.Kind != ast.KindClassStaticBlockDeclaration && !(node.Parent.Kind == ast.KindCatchClause && rule.Boolean("allowEmptyCatch")) {
		rule.context.Report(rule.context.Range(node), diagnostics.Empty_block_statement)
	} else if node.Kind == ast.KindCaseBlock && len(node.AsCaseBlock().Clauses.Nodes) == 0 && helpers.SourceEmptyText(rule.context, node) {
		rule.context.Report(rule.context.Range(node), diagnostics.Empty_switch_statement)
	}

	return true
}

func (rule *noEmpty) Options() map[string]any {
	if len(rule.context.Options) > 0 {
		options, _ := rule.context.Options[0].(map[string]any)
		return options
	}
	return nil
}

func (rule *noEmpty) Boolean(name string) bool {
	value, _ := rule.Options()[name].(bool)
	return value
}
