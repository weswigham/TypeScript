package api

import (
	"context"
	"crypto/rand"
	"errors"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"sync/atomic"
	"testing"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/bundled"
	"github.com/microsoft/TypeScript/tsc/internal/compiler"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/lint"
	linthost "github.com/microsoft/TypeScript/tsc/internal/lint/host"
	"github.com/microsoft/TypeScript/tsc/internal/ls"
	"github.com/microsoft/TypeScript/tsc/internal/ls/lsconv"
	"github.com/microsoft/TypeScript/tsc/internal/ls/lsutil"
	"github.com/microsoft/TypeScript/tsc/internal/lsp/lsproto"
	"github.com/microsoft/TypeScript/tsc/internal/project"
	"github.com/microsoft/TypeScript/tsc/internal/spanmap"
	"github.com/microsoft/TypeScript/tsc/internal/testutil/projecttestutil"
	"github.com/microsoft/TypeScript/tsc/internal/tsoptions"
	"github.com/microsoft/TypeScript/tsc/internal/tspath"
	"github.com/microsoft/TypeScript/tsc/internal/vfs/vfstest"
	"gotest.tools/v3/assert"
)

type editorAPIHost struct {
	ls.Host
	cache      lint.Cache
	plugins    lint.Host
	converters *lsconv.Converters
}

func (h *editorAPIHost) Converters() *lsconv.Converters { return h.converters }
func (*editorAPIHost) GetPreferences(string) lsutil.UserPreferences {
	return lsutil.NewDefaultUserPreferences()
}

func (h *editorAPIHost) GetLintDiagnostics(ctx context.Context, program *compiler.Program, files []*ast.SourceFile) []*ast.Diagnostic {
	return h.cache.GetDiagnostics(lint.WithHost(ctx, h.plugins), program, files)
}

type editorCountingHost struct {
	lint.Host
	inspections atomic.Int32
	files       atomic.Int32
	bindingMu   sync.Mutex
	binding     *lint.ProjectBinding
}

func (h *editorCountingHost) InspectPlugins(ctx context.Context, options linthost.PluginOptions) ([]string, error) {
	h.inspections.Add(1)
	return h.Host.InspectPlugins(ctx, options)
}

func (h *editorCountingHost) LintBatch(ctx context.Context, program *compiler.Program, options linthost.PluginOptions, rules map[string]any, files []*ast.SourceFile) (*linthost.BatchResult, error) {
	h.files.Add(int32(len(files)))
	return h.Host.LintBatch(ctx, program, options, rules, files)
}

func (h *editorCountingHost) LintBatchWithProject(ctx context.Context, program *compiler.Program, options linthost.PluginOptions, rules map[string]any, files []*ast.SourceFile, binding *lint.ProjectBinding) (*linthost.BatchResult, error) {
	h.files.Add(int32(len(files)))
	h.bindingMu.Lock()
	h.binding = binding
	h.bindingMu.Unlock()
	projectHost, ok := h.Host.(lint.ProjectHost)
	if !ok {
		return nil, errors.New("underlying lint host does not support project bindings")
	}
	return projectHost.LintBatchWithProject(ctx, program, options, rules, files, binding)
}

func TestLintEditorUsesOwningProjectSnapshot(t *testing.T) {
	t.Parallel()
	host, options, _, _ := newLifecycleHost(t, 1)
	root := options.CurrentDirectory
	plugin := filepath.Join(root, "packages", "typescript", "test", "lint", "fixtures", "editor.mjs")
	fs := bundled.WrapFS(vfstest.FromMap(map[string]string{
		"/project/input.ts": `debugger;`,
		"/project/tsconfig.json": `{
			"files":["input.ts"],
			"lint":{"plugins":{"editor":` + strconv.Quote(plugin) + `},"rules":{"editor/debugger":"error"}}
		}`,
	}, tspath.CaseSensitive))
	counted := &editorCountingHost{Host: host}
	session := NewStandaloneSession(&project.SessionInit{
		BackgroundCtx: t.Context(),
		FS:            fs,
		LintHost:      counted,
		Options: &project.SessionOptions{
			CurrentDirectory: "/project", DefaultLibraryPath: bundled.LibPath(),
			PositionEncoding: lsproto.PositionEncodingKindUTF8, RunExternalCode: true,
		},
	}, nil)
	defer session.Close()
	response, err := session.handleCreateSnapshot(t.Context(), &CreateSnapshotParams{
		OpenFiles: []DocumentIdentifier{{FileName: "/project/input.ts"}},
	})
	assert.NilError(t, err)
	snapshotData, err := session.getSnapshotData(response.Snapshot)
	assert.NilError(t, err)
	proj, err := snapshotData.getProject(response.Projects[0].Handle)
	assert.NilError(t, err)
	service := ls.NewLanguageService(proj.ID(), proj.GetProgram(), snapshotData.snapshot, "/project/input.ts")
	report, err := service.ProvideDiagnostics(t.Context(), "file:///project/input.ts")
	assert.NilError(t, err)
	assert.Equal(t, len(report.FullDocumentDiagnosticReport.Items), 1)
	assert.Equal(t, *report.FullDocumentDiagnosticReport.Items[0].Code.String, "editor/debugger")

	counted.bindingMu.Lock()
	binding := counted.binding
	counted.bindingMu.Unlock()
	assert.Assert(t, binding != nil)
	assert.Equal(t, binding.Snapshot.ID(), snapshotData.snapshot.ID())
	assert.Equal(t, binding.Handle, uint64(proj.Handle()))
}

func TestLintEditorEnabledPluginMappedConcurrentPulls(t *testing.T) {
	t.Parallel()
	host, options, _, _ := newLifecycleHost(t, 2)
	plugin := filepath.Join(options.CurrentDirectory, "packages", "typescript", "test", "lint", "fixtures", "editor.mjs")
	contents := map[string]string{
		"/project/component.ts":    ";\ndebugger;",
		"/project/supplemental.ts": ";\ndebugger;",
		"/project/tsconfig.json":   `{"compilerOptions":{"lib":["es2025"]},"files":["component.ts","supplemental.ts"],"lint":{"plugins":{"editor":` + strconv.Quote(plugin) + `},"rules":{"editor/debugger":"error"}}}`,
	}

	fs := vfstest.FromMap(contents, tspath.CaseSensitive)
	config, errors := tsoptions.GetParsedCommandLineOfConfigFile("/project/tsconfig.json", &core.CompilerOptions{NoLib: core.TSTrue, RunExternalCode: core.TSTrue}, nil, tsoptions.NewDefaultParseConfigHost(fs), nil)
	assert.Equal(t, len(errors), 0)
	assert.Equal(t, len(config.Errors), 0)
	program := compiler.NewProgram(compiler.ProgramOptions{Config: config, Host: compiler.NewCompilerHost(fs, "/lib", nil, nil, nil)})
	file, supplemental := program.GetSourceFile("/project/component.ts"), program.GetSourceFile("/project/supplemental.ts")
	const original = "<script>\ndebugger;\n</script>\n<script>\ndebugger;\n</script>"
	// Both virtual files are ";\ndebugger;": their statements map to separate
	// script blocks, while the generated prefixes have no original spans.
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
	counted := &editorCountingHost{Host: host}
	editorHost := &editorAPIHost{
		plugins: counted,
		converters: lsconv.NewConverters(lsproto.PositionEncodingKindUTF16, func(tspath.RootedFilePath) *lsconv.LSPLineMap {
			return lsconv.ComputeLSPLineStarts(original)
		}),
	}
	service := ls.NewLanguageService(nil, program, editorHost, file.FileName().AsString())
	ctx := t.Context()
	const uri = lsproto.DocumentUri("file:///project/component.ts")
	var pulls sync.WaitGroup
	for range 8 {
		pulls.Go(func() {
			response, err := service.ProvideDiagnostics(ctx, uri)
			assert.NilError(t, err)
			reports := response.FullDocumentDiagnosticReport.Items
			assert.Equal(t, len(reports), 2)
			for index, line := range []uint32{1, 4} {
				assert.Equal(t, *reports[index].Code.String, "editor/debugger")
				assert.Equal(t, reports[index].Range.Start.Line, line)
				assert.Equal(t, reports[index].Range.End.Character, uint32(9))
			}
		})
	}
	pulls.Wait()
	response, err := service.ProvideDiagnostics(ctx, uri)
	assert.NilError(t, err)
	actions, err := service.ProvideCodeActions(ctx, &lsproto.CodeActionParams{
		TextDocument: lsproto.TextDocumentIdentifier{Uri: uri},
		Context:      &lsproto.CodeActionContext{Diagnostics: response.FullDocumentDiagnosticReport.Items},
	})
	assert.NilError(t, err)
	assert.Equal(t, len(*actions.CommandOrCodeActionArray), 3)
	combined := (*actions.CommandOrCodeActionArray)[2].CodeAction
	edits := (*combined.Edit.Changes)[uri]
	assert.Equal(t, len(edits), 2)
	assert.Equal(t, edits[0].Range.Start.Line, uint32(1))
	assert.Equal(t, edits[1].Range.Start.Line, uint32(4))
	assert.Equal(t, counted.inspections.Load(), int32(1))
	assert.Equal(t, counted.files.Load(), int32(2))
}

func TestLintEditorRestartsHostForPluginDependencyChanges(t *testing.T) {
	t.Parallel()
	testLintEditorPluginReload(t, false, false)
}

func TestLintEditorRecoversFromPluginLoadFailure(t *testing.T) {
	t.Parallel()
	testLintEditorPluginReload(t, true, false)
}

func TestLintEditorRecoversFromBarePluginLoadFailure(t *testing.T) {
	t.Parallel()
	testLintEditorPluginReload(t, true, true)
}

func testLintEditorPluginReload(t *testing.T, broken, named bool) {
	t.Helper()
	host, _, _, _ := newLifecycleHost(t, 1)
	directory := ".lint-editor-" + rand.Text()
	assert.NilError(t, os.Mkdir(directory, 0o700))
	defer func() { assert.NilError(t, os.RemoveAll(directory)) }()
	pluginDirectory := filepath.Join(directory, "node_modules", "editor-plugin")
	assert.NilError(t, os.MkdirAll(pluginDirectory, 0o700))
	assert.NilError(t, os.WriteFile(filepath.Join(pluginDirectory, "package.json"), []byte(`{"name":"editor-plugin","type":"module","exports":"./dist/nested/index.mjs"}`), 0o600))
	dependencyDirectory := filepath.Join(pluginDirectory, "node_modules", "editor-helper", "dist", "internal")
	assert.NilError(t, os.MkdirAll(dependencyDirectory, 0o700))
	assert.NilError(t, os.WriteFile(filepath.Join(pluginDirectory, "node_modules", "editor-helper", "package.json"), []byte(`{"name":"editor-helper","type":"module","exports":"./dist/index.mjs"}`), 0o600))
	assert.NilError(t, os.WriteFile(filepath.Join(pluginDirectory, "node_modules", "editor-helper", "dist", "index.mjs"), []byte(`export { default } from "./internal/message.mjs";`), 0o600))
	initial := []byte(`export default "original plugin";`)
	if broken {
		initial = []byte(`export default {`)
	}
	assert.NilError(t, os.WriteFile(filepath.Join(dependencyDirectory, "message.mjs"), initial, 0o600))
	source := []byte(`
		import message from "editor-helper";
		export default { rules: { example: {
			meta: { type: "problem", schema: [] },
			create(context) { return { DebuggerStatement(node) { context.report({ node, message }); } }; }
		} } };
	`)
	entryDirectory := filepath.Join(pluginDirectory, "dist", "nested")
	assert.NilError(t, os.MkdirAll(entryDirectory, 0o700))
	assert.NilError(t, os.WriteFile(filepath.Join(entryDirectory, "index.mjs"), source, 0o600))
	entry, err := filepath.Abs(filepath.Join(entryDirectory, "index.mjs"))
	assert.NilError(t, err)
	pluginDescriptor := strconv.Quote(entry)
	if named {
		resolutionDirectory, pathErr := filepath.Abs(directory)
		assert.NilError(t, pathErr)
		pluginDescriptor = `{"specifier":"editor-plugin","resolveFrom":` + strconv.Quote(resolutionDirectory) + `}`
	}
	files := map[string]any{
		"/project/main.ts":       "debugger;",
		"/project/tsconfig.json": `{"compilerOptions":{"noLib":true,"lib":["es2025"]},"files":["main.ts"],"lint":{"plugins":{"local":` + pluginDescriptor + `},"rules":{"local/example":"error"}}}`,
	}
	init, utils := projecttestutil.GetSessionInitOptions(files, &project.SessionOptions{
		CurrentDirectory: "/project", DefaultLibraryPath: bundled.LibPath(),
		PositionEncoding: lsproto.PositionEncodingKindUTF16, RunExternalCode: true, WatchEnabled: true,
	}, nil)
	var registered sync.Map
	utils.Client().WatchFilesFunc = func(_ context.Context, id project.WatcherID, watchers []*lsproto.FileSystemWatcher) error {
		if strings.HasPrefix(string(id), "lint-plugins") {
			for _, watcher := range watchers {
				if watcher.GlobPattern.Pattern != nil {
					registered.Store(*watcher.GlobPattern.Pattern, true)
				}
			}
		}
		return nil
	}
	init.LintHost = host
	session := project.NewSession(init)
	defer session.Close()
	ctx := t.Context()
	const uri = lsproto.DocumentUri("file:///project/main.ts")
	session.DidOpenFile(ctx, uri, 1, "debugger;", lsproto.LanguageKindTypeScript)
	service, err := session.GetLanguageService(ctx, uri)
	assert.NilError(t, err)
	first, err := service.ProvideDiagnostics(ctx, uri)
	assert.NilError(t, err)
	assert.Equal(t, len(first.FullDocumentDiagnosticReport.Items), 1)
	if broken {
		assert.Assert(t, strings.Contains(*first.FullDocumentDiagnosticReport.Items[0].Message.String, "Lint plugin failed"))
	} else {
		assert.Equal(t, *first.FullDocumentDiagnosticReport.Items[0].Message.String, "original plugin")
	}
	session.WaitForBackgroundTasks()
	root, err := filepath.Abs(pluginDirectory)
	assert.NilError(t, err)
	packageRoot := tspath.RootedDirectoryPathFromAbsolute(root)
	_, watchingPackage := registered.Load(packageRoot.ResolveFile("**/*").AsString())
	assert.Assert(t, watchingPackage, "expected a recursive watch scoped to the declared plugin package")
	host.mu.Lock()
	firstControl := host.control
	host.mu.Unlock()
	assert.NilError(t, os.WriteFile(filepath.Join(dependencyDirectory, "message.mjs"), []byte(`export default "updated plugin";`), 0o600))
	dependency, err := filepath.Abs(filepath.Join(dependencyDirectory, "message.mjs"))
	assert.NilError(t, err)
	session.DidChangeWatchedFiles(ctx, []*lsproto.FileEvent{{
		Uri: lsconv.FileNameToDocumentURI(tspath.RootedFilePathFromAbsolute(dependency)), Type: lsproto.FileChangeTypeChanged,
	}})
	updated, err := service.ProvideDiagnostics(ctx, uri)
	assert.NilError(t, err)
	assert.Equal(t, len(updated.FullDocumentDiagnosticReport.Items), 1)
	assert.Equal(t, *updated.FullDocumentDiagnosticReport.Items[0].Message.String, "updated plugin")
	host.mu.Lock()
	assert.Assert(t, host.control != firstControl)
	host.mu.Unlock()
}
