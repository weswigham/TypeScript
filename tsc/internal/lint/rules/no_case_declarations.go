package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
)

type noCaseDeclarations struct {
	context Context
}

func newNoCaseDeclarations(context Context) Rule {
	rule := &noCaseDeclarations{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindClassDeclaration, ast.KindFunctionDeclaration, ast.KindVariableStatement},
	}
}

func (rule *noCaseDeclarations) OnEnterNode(node *ast.Node) bool {
	if node.Parent != nil && (node.Parent.Kind == ast.KindCaseClause || node.Parent.Kind == ast.KindDefaultClause) {
		if node.Kind == ast.KindFunctionDeclaration || node.Kind == ast.KindClassDeclaration || node.Kind == ast.KindVariableStatement && node.AsVariableStatement().DeclarationList.Flags&(ast.NodeFlagsLet|ast.NodeFlagsConst|ast.NodeFlagsUsing) != 0 {
			rule.context.Report(rule.context.Range(node), diagnostics.Unexpected_lexical_declaration_in_case_block)
		}
	}

	return true
}
