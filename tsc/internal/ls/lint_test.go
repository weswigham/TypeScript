package ls

import (
	"context"
	"strings"
	"sync"
	"sync/atomic"
	"testing"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/compiler"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint"
	linthost "github.com/microsoft/TypeScript/tsc/internal/lint/host"
	"github.com/microsoft/TypeScript/tsc/internal/locale"
	"github.com/microsoft/TypeScript/tsc/internal/ls/lsconv"
	"github.com/microsoft/TypeScript/tsc/internal/lsp/lsproto"
	"github.com/microsoft/TypeScript/tsc/internal/spanmap"
	"github.com/microsoft/TypeScript/tsc/internal/tsoptions"
	"github.com/microsoft/TypeScript/tsc/internal/tspath"
	"github.com/microsoft/TypeScript/tsc/internal/vfs/vfstest"
	"gotest.tools/v3/assert"
)

func TestLintCodeActionRuleIdentity(t *testing.T) {
	t.Parallel()
	custom := ast.NewLintDiagnostic(nil, core.TextRange{}, diagnostics.CategoryError, "local/example", "message", "example")
	native := ast.NewCompilerDiagnostic(diagnostics.Unexpected_debugger_statement)
	assert.Assert(t, matchesLintDiagnosticCode(&lsproto.IntegerOrString{String: new("local/example")}, custom))
	assert.Assert(t, !matchesLintDiagnosticCode(&lsproto.IntegerOrString{String: new("other/example")}, custom))
	assert.Assert(t, !matchesLintDiagnosticCode(&lsproto.IntegerOrString{Integer: new(custom.Code())}, custom))
	assert.Assert(t, matchesLintDiagnosticCode(&lsproto.IntegerOrString{Integer: new(native.Code())}, native))
}

type editorLintHost struct {
	Host
	cache  lint.Cache
	plugin *editorPluginHost
}

func (h *editorLintHost) GetLintDiagnostics(ctx context.Context, program *compiler.Program, files []*ast.SourceFile) []*ast.Diagnostic {
	return h.cache.GetDiagnostics(lint.WithHost(ctx, h.plugin), program, files)
}

type editorPluginHost struct {
	inspections atomic.Int32
	files       atomic.Int32
	fail        bool
}

func (h *editorPluginHost) InspectPlugins(context.Context, linthost.PluginOptions) ([]string, error) {
	h.inspections.Add(1)
	return []string{"local/example"}, nil
}

func (h *editorPluginHost) LintBatch(_ context.Context, _ *compiler.Program, _ linthost.PluginOptions, _ map[string]any, files []*ast.SourceFile) (*linthost.BatchResult, error) {
	result := &linthost.BatchResult{}
	for _, file := range files {
		h.files.Add(1)
		output := linthost.FileResult{FileName: file.FileName().AsString()}
		if h.fail {
			output.Error = "unsupported plugin selector"
		} else {
			output.Messages = []linthost.Message{{
				RuleID: "local/example", Severity: 2, Message: "remove debugger", Start: 2, End: 10,
				Fix: &linthost.Fix{Range: [2]int{2, 11}},
			}}
		}
		result.Files = append(result.Files, output)
	}
	return result, nil
}

func (*editorPluginHost) Workers() int { return 1 }
func (*editorPluginHost) Close() error { return nil }

func newMappedLintService(t *testing.T, fail bool) (*LanguageService, *editorPluginHost) {
	t.Helper()
	const original = "<script>\ndebugger;\n</script>\n<script>\ndebugger;\n</script>"
	// Each virtual output is ";\ndebugger;". Its debugger statement maps verbatim
	// onto one script block; the generated prefix has no original source span.
	const virtual = ";\ndebugger;"
	fs := vfstest.FromMap(map[string]string{
		"/project/component.ts":    virtual,
		"/project/supplemental.ts": virtual,
		"/project/tsconfig.json":   `{"files":["component.ts","supplemental.ts"],"lint":{"plugins":{"local":"./rules.mjs"},"rules":{"local/example":"error"}}}`,
	}, tspath.CaseSensitive)
	config, errors := tsoptions.GetParsedCommandLineOfConfigFile("/project/tsconfig.json", &core.CompilerOptions{NoLib: core.TSTrue, RunExternalCode: core.TSTrue}, nil, tsoptions.NewDefaultParseConfigHost(fs), nil)
	assert.Equal(t, len(errors), 0)
	assert.Equal(t, len(config.Errors), 0)
	program := compiler.NewProgram(compiler.ProgramOptions{Config: config, Host: compiler.NewCompilerHost(fs, "/lib", nil, nil, nil)})
	file := program.GetSourceFile("/project/component.ts")
	supplemental := program.GetSourceFile("/project/supplemental.ts")
	for index, source := range []*ast.SourceFile{file, supplemental} {
		start := strings.Index(original, "debugger;")
		info := ast.ContentMapperSourceFileInfo{ContentMapper: "test", OriginalText: original}
		if index == 0 {
			info.SupplementalSourceFiles = []*ast.SourceFile{supplemental}
		} else {
			start = strings.LastIndex(original, "debugger;")
			info.CanonicalSourceFile = file
		}
		info.SpanMap = spanmap.New([]spanmap.Segment{{
			VirtualStart: 2, VirtualEnd: 11, OriginalStart: core.TextPos(start), OriginalEnd: core.TextPos(start + 9),
			Kind: spanmap.KindVerbatim, Features: spanmap.FeatureAll,
		}})
		source.SetContentMapperInfo(info)
	}
	plugin := &editorPluginHost{fail: fail}
	return &LanguageService{
		host: &editorLintHost{plugin: plugin}, program: program,
		converters: lsconv.NewConverters(lsproto.PositionEncodingKindUTF16, func(_ tspath.RootedFilePath) *lsconv.LSPLineMap {
			return lsconv.ComputeLSPLineStarts(original)
		}),
	}, plugin
}

func TestLintPluginMappedDiagnosticsAndActionsReuseResults(t *testing.T) {
	t.Parallel()
	service, plugin := newMappedLintService(t, false)
	ctx := t.Context()
	uri := lsproto.DocumentUri("file:///project/component.ts")
	var pulls sync.WaitGroup
	for range 8 {
		pulls.Go(func() {
			report, err := service.ProvideDiagnostics(ctx, uri)
			assert.NilError(t, err)
			assert.Equal(t, len(report.FullDocumentDiagnosticReport.Items), 2)
		})
	}
	pulls.Wait()
	report, err := service.ProvideDiagnostics(ctx, uri)
	assert.NilError(t, err)
	diags := report.FullDocumentDiagnosticReport.Items
	for index, line := range []uint32{1, 4} {
		assert.Equal(t, *diags[index].Code.String, "local/example")
		assert.Equal(t, diags[index].Range, lsproto.Range{
			Start: lsproto.Position{Line: line}, End: lsproto.Position{Line: line, Character: 8},
		})
	}
	response, err := service.ProvideCodeActions(ctx, &lsproto.CodeActionParams{
		TextDocument: lsproto.TextDocumentIdentifier{Uri: uri},
		Context:      &lsproto.CodeActionContext{Diagnostics: diags},
	})
	assert.NilError(t, err)
	assert.Equal(t, len(*response.CommandOrCodeActionArray), 3)
	for index, action := range (*response.CommandOrCodeActionArray)[:2] {
		changes := *action.CodeAction.Edit.Changes
		assert.Equal(t, len(changes), 1)
		edits := changes[uri]
		assert.Equal(t, len(edits), 1)
		assert.Equal(t, edits[0].Range.Start.Line, []uint32{1, 4}[index])
		assert.Equal(t, edits[0].Range.End.Character, uint32(9))
		assert.Equal(t, edits[0].NewText, "")
	}
	fixes := service.lintCodeFixes(ctx, service.program, service.program.GetSourceFile("/project/component.ts"))
	changes := service.codeFixWorkspaceChanges(service.program, codefix.CombineCodeFixes(fixes).Changes)
	assert.Equal(t, len(changes[uri]), 2)
	assert.Equal(t, plugin.inspections.Load(), int32(1))
	assert.Equal(t, plugin.files.Load(), int32(2))
}

func TestLintPluginMappedFailuresAreReported(t *testing.T) {
	t.Parallel()
	service, _ := newMappedLintService(t, true)
	response, err := service.ProvideDiagnostics(t.Context(), "file:///project/component.ts")
	assert.NilError(t, err)
	reports := response.FullDocumentDiagnosticReport.Items
	assert.Assert(t, len(reports) > 0)
	for _, report := range reports {
		assert.Assert(t, strings.Contains(*report.Message.String, "unsupported plugin selector"))
	}
}

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
