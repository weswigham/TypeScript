package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
)

type noEmptyStaticBlock struct {
	context Context
}

func newNoEmptyStaticBlock(context Context) Rule {
	rule := &noEmptyStaticBlock{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindClassStaticBlockDeclaration},
	}
}

func (rule *noEmptyStaticBlock) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindClassStaticBlockDeclaration && helpers.IsEmptyCommentFreeBlock(rule.context, node.AsClassStaticBlockDeclaration().Body) {
		rule.context.Report(rule.context.Range(node.AsClassStaticBlockDeclaration().Body), diagnostics.Unexpected_empty_static_block)
	}

	return true
}
