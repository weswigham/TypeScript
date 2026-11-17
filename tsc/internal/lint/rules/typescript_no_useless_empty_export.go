package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type typescriptNoUselessEmptyExportRule struct {
	context Context
}

func (rule *typescriptNoUselessEmptyExportRule) OnEnterNode(node *ast.Node) bool {
	rule.emptyExport(node)
	return true
}

func (rule *typescriptNoUselessEmptyExportRule) OnExitNode(node *ast.Node) {}

func (rule *typescriptNoUselessEmptyExportRule) emptyExport(node *ast.Node) {
	if rule.context.File.IsDeclarationFile || node.Kind != ast.KindSourceFile {
		return
	}
	statements := node.Statements()
	other := false
	for _, statement := range statements {
		if !typescriptNoUselessEmptyExportIsEmpty(statement) && (ast.HasSyntacticModifier(statement, ast.ModifierFlagsExport) || statement.Kind == ast.KindImportDeclaration || statement.Kind == ast.KindImportEqualsDeclaration || statement.Kind == ast.KindExportDeclaration || statement.Kind == ast.KindExportAssignment || statement.Kind == ast.KindNamespaceExportDeclaration) {
			other = true
			break
		}
	}
	if !other {
		return
	}
	for _, statement := range statements {
		if typescriptNoUselessEmptyExportIsEmpty(statement) {
			diagnostic := rule.context.Report(rule.context.Range(statement), diagnostics.Empty_export_does_nothing_and_can_be_removed)
			rule.fix(diagnostic, rule.Start(statement), statement.End(), "")
		}
	}
}

func (rule *typescriptNoUselessEmptyExportRule) fix(diagnostic *ast.Diagnostic, start, end int, text string) {
	tracker := rule.context.NewTracker()
	tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(start, end), text)
	const name = "@typescript-eslint/no-useless-empty-export"
	diagnostic.SetCodeFixes(codefix.CreateCodeFixAction(name, tracker.GetTextChanges(), ast.NewCompilerDiagnostic(diagnostics.Fix_0, "no-useless-empty-export"), name, ast.NewCompilerDiagnostic(diagnostics.Fix_all_0, "no-useless-empty-export")))
}

func (rule *typescriptNoUselessEmptyExportRule) Start(node *ast.Node) int {
	return scanner.GetTokenPosOfNode(node, rule.context.File, false)
}

func typescriptNoUselessEmptyExportIsEmpty(node *ast.Node) bool {
	if node.Kind != ast.KindExportDeclaration {
		return false
	}
	clause := node.AsExportDeclaration().ExportClause
	return clause != nil && clause.Kind == ast.KindNamedExports && len(clause.AsNamedExports().Elements.Nodes) == 0
}

func newTypeScriptNoUselessEmptyExport(context Context) Rule {
	return &typescriptNoUselessEmptyExportRule{context: context}
}
