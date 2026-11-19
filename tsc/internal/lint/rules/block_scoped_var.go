package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type blockScopedVarRule struct{ context Context }

func newBlockScopedVarRule(context Context) Rule {
	rule := &blockScopedVarRule{context: context}

	return Rule{
		Enter:      rule.OnEnterNode,
		EnterKinds: []ast.Kind{ast.KindIdentifier},
	}
}

func (rule *blockScopedVarRule) OnEnterNode(node *ast.Node) bool {
	rule.checkBlockScopedVar(node)
	return true
}

func blockScopedVarReference(node *ast.Node) bool {
	if node.Kind != ast.KindIdentifier {
		return false
	}
	if helpers.SharedValueReference(node) {
		return true
	}
	if declaration := ast.GetDeclarationFromName(node); declaration != nil {
		root := ast.GetRootDeclaration(declaration)
		if root.Kind == ast.KindVariableDeclaration {
			return root.Initializer() != nil || root.Parent.Kind == ast.KindVariableDeclarationList && ast.IsForInOrOfStatement(root.Parent.Parent)
		}
	}
	if node.Parent.Kind == ast.KindExportSpecifier && node.Parent.PropertyNameOrName() == node {
		return node.Parent.Parent.Parent.AsExportDeclaration().ModuleSpecifier == nil
	}
	return false
}

func (rule *blockScopedVarRule) checkBlockScopedVar(node *ast.Node) {
	if !blockScopedVarReference(node) {
		return
	}
	symbol := rule.context.GetChecker().ResolveName(node.Text(), node, ast.SymbolFlagsValue, false)
	if symbol == nil {
		return
	}
	seen := make(map[*ast.Node]bool)
	for _, declaration := range symbol.Declarations() {
		root := ast.GetRootDeclaration(declaration)
		if root.Kind != ast.KindVariableDeclaration || root.Parent.Kind != ast.KindVariableDeclarationList || root.Parent.Flags&ast.NodeFlagsBlockScoped != 0 || ast.GetSourceFileOfNode(root) != rule.context.File {
			continue
		}
		list := root.Parent
		if seen[list] {
			continue
		}
		seen[list] = true
		var scope *ast.Node
		for parent := list.Parent; parent != nil; parent = parent.Parent {
			switch parent.Kind {
			case ast.KindSourceFile, ast.KindBlock, ast.KindForStatement, ast.KindForInStatement, ast.KindForOfStatement, ast.KindSwitchStatement, ast.KindCatchClause, ast.KindClassStaticBlockDeclaration:
				scope = parent
			}
			if scope != nil {
				break
			}
		}
		if scope != nil && (node.Pos() < scope.Pos() || node.End() > scope.End()) {
			position := scanner.GetTokenPosOfNode(declaration.Name(), rule.context.File, false)
			line, column := scanner.GetECMALineAndUTF16CharacterOfPosition(rule.context.File, position)
			rule.context.Report(rule.context.Range(node), diagnostics.X_0_declared_on_line_1_column_2_is_used_outside_of_binding_context, node.Text(), line+1, int(column)+1)
		}
	}
}
