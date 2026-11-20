package lint

import (
	"context"
	"errors"
	"sync"
	"sync/atomic"
	"testing"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/compiler"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	linthost "github.com/microsoft/TypeScript/tsc/internal/lint/host"
	"github.com/microsoft/TypeScript/tsc/internal/tsoptions"
	"github.com/microsoft/TypeScript/tsc/internal/tspath"
	"github.com/microsoft/TypeScript/tsc/internal/vfs/vfstest"
	"gotest.tools/v3/assert"
)

type cachedLintHost struct {
	calls        atomic.Int32
	started      chan struct{}
	release      chan struct{}
	firstFailure string
}

func (*cachedLintHost) InspectPlugins(context.Context, linthost.PluginOptions) ([]string, error) {
	return []string{"local/example"}, nil
}

func (h *cachedLintHost) LintBatch(ctx context.Context, _ *compiler.Program, _ linthost.PluginOptions, _ map[string]any, files []*ast.SourceFile) (*linthost.BatchResult, error) {
	call := h.calls.Add(1)
	if call == 1 && h.firstFailure == "transport" {
		return nil, errors.New("worker exited")
	}
	if call == 1 && h.started != nil {
		close(h.started)
		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		case <-h.release:
			if err := ctx.Err(); err != nil {
				return nil, err
			}
		}
	}
	result := &linthost.BatchResult{}
	for _, file := range files {
		if call == 1 && h.firstFailure == "runtime" {
			result.Files = append(result.Files, linthost.FileResult{FileName: file.FileName().AsString(), Error: "plugin execution failed"})
			continue
		}
		result.Files = append(result.Files, linthost.FileResult{
			FileName: file.FileName().AsString(),
			Messages: []linthost.Message{{RuleID: "local/example", Severity: 2, Message: "example", Start: 0, End: 8}},
		})
	}

	return result, nil
}

func (*cachedLintHost) Workers() int { return 1 }
func (*cachedLintHost) Close() error { return nil }

func TestLintCacheRetriesPluginFailures(t *testing.T) {
	t.Parallel()
	for _, failure := range []string{"transport", "runtime"} {
		t.Run(failure, func(t *testing.T) {
			t.Parallel()
			program, file := cacheTestProgram(t)
			host := &cachedLintHost{firstFailure: failure}
			ctx := WithHost(t.Context(), host)
			var cache Cache
			first := cache.GetDiagnostics(ctx, program, []*ast.SourceFile{file})
			assert.Equal(t, len(first), 1)
			assert.Equal(t, first[0].Code(), diagnostics.Lint_plugin_failed_Colon_0.Code())
			second := cache.GetDiagnostics(ctx, program, []*ast.SourceFile{file})
			assert.Equal(t, len(second), 1)
			assert.Equal(t, second[0].LintRuleName(), "local/example")
			cache.GetDiagnostics(ctx, program, []*ast.SourceFile{file})
			assert.Equal(t, host.calls.Load(), int32(2))
		})
	}
}

func cacheTestProgram(t *testing.T) (*compiler.Program, *ast.SourceFile) {
	t.Helper()
	fs := vfstest.FromMap(map[string]string{
		"/project/input.ts":      "debugger;",
		"/project/tsconfig.json": `{"files":["input.ts"],"lint":{"plugins":{"local":"./rules.mjs"},"rules":{"local/example":"error"}}}`,
	}, tspath.CaseSensitive)
	config, errors := tsoptions.GetParsedCommandLineOfConfigFile("/project/tsconfig.json", &core.CompilerOptions{NoLib: core.TSTrue, RunExternalCode: core.TSTrue}, nil, tsoptions.NewDefaultParseConfigHost(fs), nil)
	assert.Equal(t, len(errors), 0)
	assert.Equal(t, len(config.Errors), 0)
	program := compiler.NewProgram(compiler.ProgramOptions{Config: config, Host: compiler.NewCompilerHost(fs, "/lib", nil, nil, nil)})
	return program, program.GetSourceFile("/project/input.ts")
}

func TestLintCacheConcurrentRequests(t *testing.T) {
	t.Parallel()
	program, file := cacheTestProgram(t)
	host := &cachedLintHost{started: make(chan struct{}), release: make(chan struct{})}
	ctx := WithHost(t.Context(), host)
	var cache Cache
	var requests sync.WaitGroup
	for range 8 {
		requests.Go(func() {
			reports := cache.GetDiagnostics(ctx, program, []*ast.SourceFile{file})
			assert.Equal(t, len(reports), 1)
			assert.Equal(t, reports[0].LintRuleName(), "local/example")
		})
	}
	<-host.started
	close(host.release)
	requests.Wait()
	assert.Equal(t, host.calls.Load(), int32(1))
	cache.GetDiagnostics(ctx, program, []*ast.SourceFile{file})
	assert.Equal(t, host.calls.Load(), int32(1))
	cache.Clear()
	cache.GetDiagnostics(ctx, program, []*ast.SourceFile{file})
	assert.Equal(t, host.calls.Load(), int32(2))
}

func TestLintCacheCancellationRetries(t *testing.T) {
	t.Parallel()
	program, file := cacheTestProgram(t)
	host := &cachedLintHost{started: make(chan struct{}), release: make(chan struct{})}
	ctx, cancel := context.WithCancel(WithHost(t.Context(), host))
	defer cancel()
	var cache Cache
	finished := make(chan struct{})
	go func() {
		defer close(finished)
		assert.Equal(t, len(cache.GetDiagnostics(ctx, program, []*ast.SourceFile{file})), 0)
	}()
	<-host.started
	waiter := make(chan []*ast.Diagnostic, 1)
	go func() {
		waiter <- cache.GetDiagnostics(WithHost(t.Context(), host), program, []*ast.SourceFile{file})
	}()
	cancel()
	<-finished
	assert.Equal(t, len(<-waiter), 1)
	assert.Equal(t, host.calls.Load(), int32(2))
	cache.GetDiagnostics(WithHost(t.Context(), host), program, []*ast.SourceFile{file})
	assert.Equal(t, host.calls.Load(), int32(2))
}
