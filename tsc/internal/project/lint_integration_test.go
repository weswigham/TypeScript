package project_test

import (
	"context"
	"slices"
	"strings"
	"sync"
	"sync/atomic"
	"testing"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/bundled"
	"github.com/microsoft/TypeScript/tsc/internal/compiler"
	linthost "github.com/microsoft/TypeScript/tsc/internal/lint/host"
	"github.com/microsoft/TypeScript/tsc/internal/lsp/lsproto"
	"github.com/microsoft/TypeScript/tsc/internal/project"
	"github.com/microsoft/TypeScript/tsc/internal/testutil/projecttestutil"
	"gotest.tools/v3/assert"
)

type editorReloadLintHost struct {
	calls       atomic.Int32
	invalidated atomic.Int32
}

func (*editorReloadLintHost) InspectPlugins(context.Context, linthost.PluginOptions) ([]string, error) {
	return []string{"local/example"}, nil
}

func (h *editorReloadLintHost) LintBatch(_ context.Context, _ *compiler.Program, _ linthost.PluginOptions, _ map[string]any, files []*ast.SourceFile) (*linthost.BatchResult, error) {
	h.calls.Add(1)
	result := &linthost.BatchResult{}
	for _, file := range files {
		message := "original plugin"
		if h.invalidated.Load() != 0 {
			message = "updated plugin"
		}
		result.Files = append(result.Files, linthost.FileResult{
			FileName: file.FileName().AsString(),
			Messages: []linthost.Message{{
				RuleID: "local/example", Severity: 2, Message: message, Start: 0, End: 8,
				Fix: &linthost.Fix{Range: [2]int{0, 9}},
			}},
		})
	}
	return result, nil
}

func (*editorReloadLintHost) Workers() int { return 1 }
func (*editorReloadLintHost) Close() error { return nil }
func (*editorReloadLintHost) WatchedFiles() []string {
	return []string{"/home/project/rules/index.mjs", "/home/project/rules/package.json"}
}

func (*editorReloadLintHost) WatchedDirectories() []string {
	return []string{"/home/project/rules"}
}
func (h *editorReloadLintHost) Invalidate() { h.invalidated.Add(1) }

func TestLintPluginSessionCachingAndModuleInvalidation(t *testing.T) {
	t.Parallel()
	files := map[string]any{
		"/home/project/main.ts":       "debugger;",
		"/home/project/tsconfig.json": `{"compilerOptions":{"noLib":true},"files":["main.ts"],"lint":{"plugins":{"local":"./rules/index.mjs"},"rules":{"local/example":"error"}}}`,
	}
	init, utils := projecttestutil.GetSessionInitOptions(files, &project.SessionOptions{
		CurrentDirectory: "/home/project", DefaultLibraryPath: bundled.LibPath(),
		PositionEncoding: lsproto.PositionEncodingKindUTF16, RunExternalCode: true, WatchEnabled: true,
	}, nil)
	host := &editorReloadLintHost{}
	init.LintHost = host
	var watchMu sync.Mutex
	var pluginPatterns []string
	utils.Client().WatchFilesFunc = func(_ context.Context, id project.WatcherID, watchers []*lsproto.FileSystemWatcher) error {
		if strings.HasPrefix(string(id), "lint-plugins") {
			watchMu.Lock()
			defer watchMu.Unlock()
			for _, watcher := range watchers {
				pluginPatterns = append(pluginPatterns, *watcher.GlobPattern.Pattern)
			}
		}
		return nil
	}
	session := project.NewSession(init)
	defer session.Close()
	ctx := t.Context()
	uri := lsproto.DocumentUri("file:///home/project/main.ts")
	session.DidOpenFile(ctx, uri, 1, "debugger;", lsproto.LanguageKindTypeScript)
	service, err := session.GetLanguageService(ctx, uri)
	assert.NilError(t, err)
	var pulls sync.WaitGroup
	for range 8 {
		pulls.Go(func() {
			response, pullErr := service.ProvideDiagnostics(ctx, uri)
			assert.NilError(t, pullErr)
			assert.Equal(t, len(response.FullDocumentDiagnosticReport.Items), 1)
			assert.Equal(t, *response.FullDocumentDiagnosticReport.Items[0].Message.String, "original plugin")
		})
	}
	pulls.Wait()
	assert.Equal(t, host.calls.Load(), int32(1))
	fixService, err := session.GetLanguageServiceWithAutoImports(ctx, session.Snapshot(), uri)
	assert.NilError(t, err)
	fixAll, err := fixService.ProvideCodeActions(ctx, &lsproto.CodeActionParams{
		TextDocument: lsproto.TextDocumentIdentifier{Uri: uri},
		Context:      &lsproto.CodeActionContext{Only: &[]lsproto.CodeActionKind{lsproto.CodeActionKindSourceFixAllTs}},
	})
	assert.NilError(t, err)
	assert.Equal(t, len(*fixAll.CommandOrCodeActionArray), 1)
	assert.Equal(t, len((*(*fixAll.CommandOrCodeActionArray)[0].CodeAction.Edit.Changes)[uri]), 1)
	assert.Equal(t, host.calls.Load(), int32(1))
	session.WaitForBackgroundTasks()
	watchMu.Lock()
	patterns := slices.Clone(pluginPatterns)
	watchMu.Unlock()
	assert.DeepEqual(t, patterns, []string{"/home/project/rules/**/*"})
	session.DidChangeWatchedFiles(ctx, []*lsproto.FileEvent{{Uri: "file:///home/project/other/main.js", Type: lsproto.FileChangeTypeChanged}})
	assert.Equal(t, host.invalidated.Load(), int32(0))
	session.DidChangeWatchedFiles(ctx, []*lsproto.FileEvent{{Uri: "file:///home/project/rules/node_modules/helper/dist/message.mjs", Type: lsproto.FileChangeTypeChanged}})
	assert.Equal(t, host.invalidated.Load(), int32(1))
	response, err := service.ProvideDiagnostics(ctx, uri)
	assert.NilError(t, err)
	assert.Equal(t, *response.FullDocumentDiagnosticReport.Items[0].Message.String, "updated plugin")
	assert.Equal(t, host.calls.Load(), int32(2))
}
