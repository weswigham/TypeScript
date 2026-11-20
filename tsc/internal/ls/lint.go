package ls

import (
	"context"
	"slices"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/compiler"
	"github.com/microsoft/TypeScript/tsc/internal/lint"
	"github.com/microsoft/TypeScript/tsc/internal/locale"
	"github.com/microsoft/TypeScript/tsc/internal/ls/change"
	"github.com/microsoft/TypeScript/tsc/internal/ls/lsconv"
	"github.com/microsoft/TypeScript/tsc/internal/lsp/lsproto"
	"github.com/microsoft/TypeScript/tsc/internal/spanmap"
)

func (l *LanguageService) codeFixWorkspaceChanges(program *compiler.Program, changes []codefix.FileTextChanges) map[lsproto.DocumentUri][]*lsproto.TextEdit {
	result := make(map[lsproto.DocumentUri][]*lsproto.TextEdit)
	for _, change := range changes {
		file := program.GetSourceFile(change.FileName)
		if file == nil || change.IsNewFile {
			return nil
		}
		uri := lsconv.FileNameToDocumentURI(file.OriginalFileName())
		for _, edit := range change.TextChanges {
			mapped, fidelity := l.converters.ToLSPRangeForFeature(file, edit.TextRange, spanmap.FeatureCodeActions)
			if !fidelity.IsExact() {
				return nil
			}
			result[uri] = append(result[uri], &lsproto.TextEdit{Range: mapped, NewText: edit.NewText})
		}
	}
	return normalizeWorkspaceChanges(result)
}

func normalizeWorkspaceChanges(changes map[lsproto.DocumentUri][]*lsproto.TextEdit) map[lsproto.DocumentUri][]*lsproto.TextEdit {
	for uri, edits := range changes {
		normalized, ok := change.NormalizeTextEdits(edits)
		if !ok {
			return nil
		}
		changes[uri] = normalized
	}
	return changes
}

func (l *LanguageService) lintCodeActions(ctx context.Context, program *compiler.Program, file *ast.SourceFile, params *lsproto.CodeActionParams) []lsproto.CommandOrCodeAction {
	if params.Context == nil || !wantsQuickFixes(params.Context.Only) {
		return nil
	}
	diagnostics := l.lintDiagnostics(ctx, program, file)
	return l.lintCodeActionsForDiagnostics(ctx, program, diagnostics, params)
}

func (l *LanguageService) lintCodeActionsForDiagnostics(ctx context.Context, program *compiler.Program, diagnostics []*ast.Diagnostic, params *lsproto.CodeActionParams) []lsproto.CommandOrCodeAction {
	var actions []lsproto.CommandOrCodeAction
	requested := make(map[string]bool)
	kind := lsproto.CodeActionKindQuickFix
	for _, diagnostic := range diagnostics {
		if diagnostic.File() == nil || len(diagnostic.CodeFixes())+len(diagnostic.CodeFixSuggestions()) == 0 {
			continue
		}
		location, fidelity := l.converters.ToLSPRangeForFeature(diagnostic.File(), diagnostic.Loc(), spanmap.FeatureCodeActions)
		if !fidelity.IsExact() {
			continue
		}
		for _, supplied := range params.Context.Diagnostics {
			if !matchesLintDiagnosticCode(supplied.Code, diagnostic) || supplied.Range != location ||
				supplied.Source != nil && *supplied.Source != "ts" {
				continue
			}
			for index, fix := range slices.Concat(diagnostic.CodeFixes(), diagnostic.CodeFixSuggestions()) {
				changes := l.codeFixWorkspaceChanges(program, fix.Changes)
				if len(changes) == 0 || len(fix.Commands) != 0 {
					continue
				}
				actions = append(actions, lsproto.CommandOrCodeAction{CodeAction: &lsproto.CodeAction{
					Title: fix.Description.Localize(locale.FromContext(ctx)), Kind: &kind,
					Edit:        &lsproto.WorkspaceEdit{Changes: &changes},
					Diagnostics: &[]*lsproto.Diagnostic{supplied},
				}})
				if index < len(diagnostic.CodeFixes()) && fix.FixID != "" && fix.FixAllDescription != nil {
					requested[fix.FixID] = true
				}
			}
			break
		}
	}
	ids := make([]string, 0, len(requested))
	for id := range requested {
		ids = append(ids, id)
	}
	slices.Sort(ids)
	for _, id := range ids {
		var fixes []*codefix.CodeFixAction
		for _, diagnostic := range diagnostics {
			for _, fix := range diagnostic.CodeFixes() {
				if fix.FixID == id && fix.FixAllDescription != nil {
					fixes = append(fixes, fix)
					break
				}
			}
		}
		if len(fixes) < 2 {
			continue
		}
		changes := l.codeFixWorkspaceChanges(program, codefix.CombineCodeFixes(fixes).Changes)
		if len(changes) > 0 {
			actions = append(actions, lsproto.CommandOrCodeAction{CodeAction: &lsproto.CodeAction{
				Title: fixes[0].FixAllDescription.Localize(locale.FromContext(ctx)), Kind: &kind,
				Edit: &lsproto.WorkspaceEdit{Changes: &changes},
			}})
		}
	}
	return actions
}

func matchesLintDiagnosticCode(code *lsproto.IntegerOrString, diagnostic *ast.Diagnostic) bool {
	if code == nil {
		return false
	}
	if name := diagnostic.LintRuleName(); name != "" {
		return code.String != nil && *code.String == name
	}
	return code.Integer != nil && *code.Integer == diagnostic.Code()
}

func (l *LanguageService) lintCodeFixes(ctx context.Context, program *compiler.Program, file *ast.SourceFile) []*codefix.CodeFixAction {
	var fixes []*codefix.CodeFixAction
	for _, diagnostic := range l.lintDiagnostics(ctx, program, file) {
		if actions := diagnostic.CodeFixes(); len(actions) > 0 {
			fixes = append(fixes, actions[0])
		}
	}
	return fixes
}

func (l *LanguageService) lintDiagnostics(ctx context.Context, program *compiler.Program, file *ast.SourceFile) []*ast.Diagnostic {
	files := append([]*ast.SourceFile{file}, file.SupplementalSourceFiles()...)
	if provider, ok := l.host.(interface {
		GetLintProjectBinding(projectID string, program *compiler.Program) *lint.ProjectBinding
	}); ok {
		ctx = lint.WithProjectBinding(ctx, provider.GetLintProjectBinding(l.projectID.String(), program))
	}
	if provider, ok := l.host.(interface {
		GetLintDiagnostics(ctx context.Context, program *compiler.Program, files []*ast.SourceFile) []*ast.Diagnostic
	}); ok {
		return provider.GetLintDiagnostics(ctx, program, files)
	}
	return lint.GetDiagnosticsForFiles(l.lintContext(ctx), program, files)
}

func (l *LanguageService) lintContext(ctx context.Context) context.Context {
	if provider, ok := l.host.(interface{ LintPluginHost() lint.Host }); ok {
		return lint.WithHost(ctx, provider.LintPluginHost())
	}
	return ctx
}
