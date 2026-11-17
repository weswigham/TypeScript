package rules

import (
	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/ls/change"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

type typescriptNoImportTypeSideEffectsRule struct {
	context Context
}

func (rule *typescriptNoImportTypeSideEffectsRule) OnEnterNode(node *ast.Node) bool {
	if node.Kind == ast.KindImportDeclaration {
		rule.importTypes(node)
	}
	return true
}

func (rule *typescriptNoImportTypeSideEffectsRule) OnExitNode(node *ast.Node) {}

func (rule *typescriptNoImportTypeSideEffectsRule) importTypes(node *ast.Node) {
	clause := node.AsImportDeclaration().ImportClause
	if clause == nil || clause.IsTypeOnly() || clause.Name() != nil {
		return
	}
	bindings := clause.AsImportClause().NamedBindings
	if bindings == nil || bindings.Kind != ast.KindNamedImports || len(bindings.AsNamedImports().Elements.Nodes) == 0 {
		return
	}
	for _, specifier := range bindings.AsNamedImports().Elements.Nodes {
		if !specifier.IsTypeOnly() {
			return
		}
	}
	diagnostic := rule.context.Report(rule.context.Range(node), diagnostics.TypeScript_will_only_remove_the_inline_type_specifiers_which_will_leave_behind_a_side_effect_import_at_runtime_Convert_this_to_a_top_level_type_qualifier_to_properly_remove_the_entire_import)
	if rule.context.NewTracker == nil {
		return
	}
	tracker := rule.context.NewTracker()
	start := scanner.GetTokenPosOfNode(node, rule.context.File, false) + len("import")
	tracker.ReplaceTextRangeWithText(rule.context.File, core.NewTextRange(start, start), " type")
	for _, specifier := range bindings.AsNamedImports().Elements.Nodes {
		start := scanner.GetTokenPosOfNode(specifier, rule.context.File, false)
		end := start + len("type")
		text := rule.context.File.Text()
		if end < len(text) && text[end] == ' ' {
			end++
		}
		tracker.DeleteRange(rule.context.File, core.NewTextRange(start, end))
	}
	rule.fix(diagnostic, tracker, ast.NewCompilerDiagnostic(diagnostics.Convert_to_a_top_level_type_import))
}

func (rule *typescriptNoImportTypeSideEffectsRule) fix(diagnostic *ast.Diagnostic, tracker *change.Tracker, description *ast.Diagnostic) {
	name := "@typescript-eslint/no-import-type-side-effects"
	diagnostic.SetCodeFixes(codefix.CreateCodeFixAction(name, tracker.GetTextChanges(), description, name, description))
}

func newTypeScriptNoImportTypeSideEffects(context Context) Rule {
	return &typescriptNoImportTypeSideEffectsRule{context: context}
}
