package ls

import (
	"context"
	"testing"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/compiler"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/locale"
	"github.com/microsoft/TypeScript/tsc/internal/ls/lsconv"
	"github.com/microsoft/TypeScript/tsc/internal/lsp/lsproto"
	"github.com/microsoft/TypeScript/tsc/internal/spanmap"
	"github.com/microsoft/TypeScript/tsc/internal/tsoptions"
	"github.com/microsoft/TypeScript/tsc/internal/tspath"
	"github.com/microsoft/TypeScript/tsc/internal/vfs/vfstest"
	"gotest.tools/v3/assert"
)

func TestLintCodeActionLocalization(t *testing.T) {
	t.Parallel()
	fs := vfstest.FromMap(map[string]any{"/input.ts": "debugger;\ndebugger;"}, tspath.CaseSensitive)
	config := tsoptions.NewParsedCommandLine(&core.CompilerOptions{NoLib: core.TSTrue}, []tspath.RootedFilePath{"/input.ts"}, nil, "/", tspath.CaseSensitive)
	program := compiler.NewProgram(compiler.ProgramOptions{Config: config, Host: compiler.NewCompilerHost(fs, "/lib", nil, nil, nil)})
	file := program.GetSourceFile("/input.ts")
	service := &LanguageService{converters: lsconv.NewConverters(lsproto.PositionEncodingKindUTF16, func(_ tspath.RootedFilePath) *lsconv.LSPLineMap {
		return lsconv.ComputeLSPLineStarts(file.Text())
	})}
	description := ast.NewCompilerDiagnostic(diagnostics.Remove_unused_declaration_for_Colon_0, "unused")
	fixAllDescription := ast.NewCompilerDiagnostic(diagnostics.Remove_unused_declarations_for_Colon_0, "unused")
	var reports []*ast.Diagnostic
	params := &lsproto.CodeActionParams{Context: &lsproto.CodeActionContext{}}
	for _, location := range []core.TextRange{core.NewTextRange(0, 9), core.NewTextRange(10, 19)} {
		report := ast.NewDiagnostic(file, location, diagnostics.Identifier_expected)
		action := codefix.CreateCodeFixAction("remove-unused", []codefix.FileTextChanges{{
			FileName: file.FileName(), TextChanges: []core.TextChange{{TextRange: location}},
		}}, description, "remove-all-unused", fixAllDescription)
		report.SetCodeFixes(action)
		reports = append(reports, report)
		mapped, fidelity := service.converters.ToLSPRangeForFeature(file, location, spanmap.FeatureCodeActions)
		assert.Assert(t, fidelity.IsExact())
		params.Context.Diagnostics = append(params.Context.Diagnostics, &lsproto.Diagnostic{
			Range: mapped, Code: &lsproto.IntegerOrString{Integer: new(report.Code())},
		})
	}
	german, ok := locale.Parse("de-DE")
	assert.Assert(t, ok)
	for _, host := range []struct {
		locale      locale.Locale
		description string
		fixAll      string
	}{
		{german, `Nicht verwendete Deklaration für "unused" entfernen`, `Nicht verwendete Deklarationen für "unused" entfernen`},
		{locale.Default, "Remove unused declaration for: 'unused'", "Remove unused declarations for: 'unused'"},
		{german, `Nicht verwendete Deklaration für "unused" entfernen`, `Nicht verwendete Deklarationen für "unused" entfernen`},
	} {
		actions := service.lintCodeActionsForDiagnostics(locale.WithLocale(context.Background(), host.locale), program, reports, params)
		assert.Equal(t, len(actions), 3)
		assert.Equal(t, actions[0].CodeAction.Title, host.description)
		assert.Equal(t, actions[1].CodeAction.Title, host.description)
		assert.Equal(t, actions[2].CodeAction.Title, host.fixAll)
	}
	for _, report := range reports {
		action := report.CodeFixes()[0]
		assert.Equal(t, action.Description, description)
		assert.Equal(t, action.FixAllDescription, fixAllDescription)
		action.FixAllDescription = nil
	}
	actions := service.lintCodeActionsForDiagnostics(context.Background(), program, reports, params)
	assert.Equal(t, len(actions), 2)
}

func TestLintCodeFixMappedProjections(t *testing.T) {
	t.Parallel()
	fs := vfstest.FromMap(map[string]any{"/input.ts": "debugger;\ndebugger;"}, tspath.CaseSensitive)
	config := tsoptions.NewParsedCommandLine(&core.CompilerOptions{NoLib: core.TSTrue}, []tspath.RootedFilePath{"/input.ts"}, nil, "/", tspath.CaseSensitive)
	program := compiler.NewProgram(compiler.ProgramOptions{Config: config, Host: compiler.NewCompilerHost(fs, "/lib", nil, nil, nil)})
	file := program.GetSourceFile("/input.ts")
	file.SetContentMapperInfo(ast.ContentMapperSourceFileInfo{
		ContentMapper: "test",
		OriginalText:  "debugger;",
		SpanMap: spanmap.New([]spanmap.Segment{
			{VirtualStart: 0, VirtualEnd: 9, OriginalStart: 0, OriginalEnd: 9, Kind: spanmap.KindVerbatim, Features: spanmap.FeatureAll},
			{VirtualStart: 10, VirtualEnd: 19, OriginalStart: 0, OriginalEnd: 9, Kind: spanmap.KindVerbatim, Features: spanmap.FeatureAll},
		}),
	})
	service := &LanguageService{converters: lsconv.NewConverters(lsproto.PositionEncodingKindUTF16, func(_ tspath.RootedFilePath) *lsconv.LSPLineMap {
		return lsconv.ComputeLSPLineStarts(file.OriginalText())
	})}
	for _, replacement := range []string{"{}", ";"} {
		changes := []codefix.FileTextChanges{{FileName: "/input.ts", TextChanges: []core.TextChange{
			{TextRange: core.NewTextRange(0, 9), NewText: "{}"},
			{TextRange: core.NewTextRange(10, 19), NewText: replacement},
		}}}
		mapped := service.codeFixWorkspaceChanges(program, changes)
		if replacement == "{}" {
			assert.Equal(t, len(mapped["file:///input.ts"]), 1)
		} else {
			assert.Equal(t, len(mapped), 0)
		}
	}
}
