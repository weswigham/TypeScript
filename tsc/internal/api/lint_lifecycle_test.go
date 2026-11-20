package api

import (
	"context"
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/bundled"
	"github.com/microsoft/TypeScript/tsc/internal/compiler"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/ipc"
	"github.com/microsoft/TypeScript/tsc/internal/json"
	"github.com/microsoft/TypeScript/tsc/internal/jsonrpc"
	linthost "github.com/microsoft/TypeScript/tsc/internal/lint/host"
	"github.com/microsoft/TypeScript/tsc/internal/tsoptions"
	"github.com/microsoft/TypeScript/tsc/internal/tspath"
	"github.com/microsoft/TypeScript/tsc/internal/vfs/vfstest"
	"gotest.tools/v3/assert"
)

type lintProcessSpawner struct{}

type lintProcess struct {
	io.Reader
	input io.WriteCloser
	cmd   *exec.Cmd
	once  sync.Once
}

func (lintProcessSpawner) Spawn(command []string, dir string, stderr io.Writer) (io.ReadWriteCloser, error) {
	cmd := exec.Command(command[0], command[1:]...)
	cmd.Dir, cmd.Stderr = dir, stderr
	input, err := cmd.StdinPipe()
	if err != nil {
		return nil, err
	}
	output, err := cmd.StdoutPipe()
	if err != nil {
		_ = input.Close()
		return nil, err
	}
	if err := cmd.Start(); err != nil {
		_ = input.Close()
		_ = output.Close()
		return nil, err
	}
	return &lintProcess{Reader: output, input: input, cmd: cmd}, nil
}

func (p *lintProcess) Write(data []byte) (int, error) { return p.input.Write(data) }

func (p *lintProcess) Close() error {
	p.once.Do(func() {
		_ = p.input.Close()
		_ = p.cmd.Process.Kill()
		_ = p.cmd.Wait()
	})
	return nil
}

func newLifecycleHost(t *testing.T, workers int) (*lintHost, linthost.PluginOptions, *compiler.Program, []*ast.SourceFile) {
	t.Helper()
	node, err := exec.LookPath("node")
	if err != nil {
		t.Skip("Node.js is required for lint worker lifecycle integration tests")
	}
	root, err := filepath.Abs(filepath.Join("..", "..", ".."))
	assert.NilError(t, err)
	shim := filepath.Join(root, "packages", "typescript", "src", "lint", "shim.ts")
	if _, err := os.Stat(filepath.Join(root, "node_modules", "eslint")); err != nil {
		if _, err := os.Stat(filepath.Join(root, "packages", "typescript", "node_modules", "eslint")); err != nil {
			t.Skip("ESLint dependencies are required for lint worker lifecycle integration tests")
		}
	}
	host := NewLintHost(t.Context(), lintProcessSpawner{}, linthost.Options{
		Command:          []string{node, "--disable-warning=ExperimentalWarning", shim},
		CurrentDirectory: tspath.RootedDirectoryPathFromAbsolute(root), Workers: workers,
		Stderr: os.Stderr,
	}).(*lintHost)
	t.Cleanup(func() { _ = host.Close() })
	options := linthost.PluginOptions{
		CurrentDirectory: root,
		Plugins:          map[string]string{"lifecycle": filepath.Join(root, "packages", "typescript", "test", "lint", "fixtures", "lifecycle.mjs")},
	}
	contents := make(map[string]string)
	names := make([]tspath.RootedFilePath, 16)
	for index := range names {
		names[index] = tspath.RootedDirectoryPathFromAbsolute(root).ResolveFile(fmt.Sprintf("input%d.ts", index))
		contents[string(names[index])] = "export const value = 1;"
	}
	fs := bundled.WrapFS(vfstest.FromMap(contents, tspath.CaseSensitive))
	config := tsoptions.NewParsedCommandLine(&core.CompilerOptions{NoCheck: core.TSTrue, Lib: []string{"lib.es2025.d.ts"}}, names, nil, tspath.RootedDirectoryPathFromAbsolute(root), tspath.CaseSensitive)
	program := compiler.NewProgram(compiler.ProgramOptions{Config: config, Host: compiler.NewCompilerHost(fs, bundled.LibPath(), nil, nil, nil)})
	files := make([]*ast.SourceFile, len(names))
	for index, name := range names {
		files[index] = program.GetSourceFile(name)
	}
	return host, options, program, files
}

func lifecycleRules(mode string) map[string]any {
	return map[string]any{"lifecycle/probe": []any{"error", mode}}
}

type lintResponseProtocol struct {
	ipc.Protocol
	response string
}

func (*lintResponseProtocol) WriteRequest(*jsonrpc.ID, string, any) error { return nil }
func (p *lintResponseProtocol) ReadMessage() (*ipc.Message, error) {
	return &ipc.Message{ID: jsonrpc.NewIDString("lintWork"), Result: json.Value(p.response)}, nil
}

func TestLintHostMalformedBatchRetiresWorker(t *testing.T) {
	t.Parallel()
	host, options, program, files := newLifecycleHost(t, 1)
	for _, response := range []string{
		`{"result":{"files":[]}}`,
		`{"result":{"files":[{"fileName":"wrong.ts","messages":[]}]}}`,
	} {
		worker, err := host.acquire(t.Context())
		assert.NilError(t, err)
		worker.conn = ipc.NewSyncConn(worker.stream, &lintResponseProtocol{response: response}, worker.session)
		host.release(worker)
		_, err = host.LintBatch(t.Context(), program, options, lifecycleRules("normal"), files[:1])
		assert.Assert(t, err != nil)
		assert.Assert(t, worker.retired)
	}
	worker, err := host.acquire(t.Context())
	assert.NilError(t, err)
	response, err := json.Marshal(map[string]any{"result": map[string]any{"files": []any{map[string]any{
		"fileName": files[0].FileName().AsString(), "messages": []any{}, "error": "plugin conversion failed",
	}}}})
	assert.NilError(t, err)
	worker.conn = ipc.NewSyncConn(worker.stream, &lintResponseProtocol{response: string(response)}, worker.session)
	host.release(worker)
	result, err := host.LintBatch(t.Context(), program, options, lifecycleRules("normal"), files[:1])
	assert.NilError(t, err)
	assert.Equal(t, result.Files[0].Error, "plugin conversion failed")
	assert.Assert(t, !worker.retired)
}

func TestLintHostApplicationErrorsPreserveWorker(t *testing.T) {
	t.Parallel()
	host, options, program, files := newLifecycleHost(t, 1)
	ctx, cancel := context.WithCancel(t.Context())
	worker, err := host.acquire(ctx)
	assert.NilError(t, err)
	cancel()
	host.release(worker)
	_, err = host.InspectPlugins(t.Context(), linthost.PluginOptions{CurrentDirectory: "relative", Plugins: map[string]string{}})
	assert.ErrorContains(t, err, "currentDirectory must be absolute")
	assert.Equal(t, host.nextID, 1)
	result, err := host.LintBatch(t.Context(), program, options, lifecycleRules("normal"), files[:1])
	assert.NilError(t, err)
	assert.Equal(t, result.Files[0].Error, "")
	assert.Equal(t, len(result.Files[0].Messages), 1)
	assert.Equal(t, host.nextID, 1)
	assert.Assert(t, !worker.retired)
}

func TestLintHostWorkerExitAndCrashRecovery(t *testing.T) {
	t.Parallel()
	for _, mode := range []string{"exit", "crash"} {
		t.Run(mode, func(t *testing.T) {
			t.Parallel()
			host, options, program, files := newLifecycleHost(t, 1)
			_, err := host.InspectPlugins(t.Context(), options)
			assert.NilError(t, err)
			_, err = host.LintBatch(t.Context(), program, options, lifecycleRules(mode), files[:1])
			if mode == "exit" {
				assert.Assert(t, err != nil)
			}
			// A crash can happen immediately after its work response. The next
			// operation then observes the closed pipe rather than that response.
			time.Sleep(100 * time.Millisecond)
			for attempt := range 4 {
				_, err = host.LintBatch(t.Context(), program, options, lifecycleRules("normal"), files[:1])
				if err == nil && host.nextID >= 2 {
					break
				}
				if attempt < 3 {
					time.Sleep(100 * time.Millisecond)
				}
			}
			assert.NilError(t, err)
			assert.Assert(t, host.nextID >= 2)
		})
	}
}

func TestLintHostCooperativeCancellationPreservesWorker(t *testing.T) {
	t.Parallel()
	host, options, program, files := newLifecycleHost(t, 1)
	_, err := host.LintBatch(t.Context(), program, options, lifecycleRules("normal"), files[:1])
	assert.NilError(t, err)
	for range 4 {
		ctx, cancel := context.WithCancel(t.Context())
		timer := time.AfterFunc(30*time.Millisecond, cancel)
		start := time.Now()
		_, workErr := host.LintBatch(ctx, program, options, lifecycleRules("sleep"), files)
		timer.Stop()
		cancel()
		assert.Assert(t, errors.Is(workErr, context.Canceled), "%v", workErr)
		assert.Assert(t, time.Since(start) < time.Second)
		assert.Equal(t, host.nextID, 1)
	}
	_, err = host.LintBatch(t.Context(), program, options, lifecycleRules("normal"), files[:1])
	assert.NilError(t, err)
}

func TestLintHostHungPluginCancellationIsBounded(t *testing.T) {
	t.Parallel()
	host, options, program, files := newLifecycleHost(t, 1)
	_, err := host.LintBatch(t.Context(), program, options, lifecycleRules("normal"), files[:1])
	assert.NilError(t, err)
	ctx, cancel := context.WithCancel(t.Context())
	timer := time.AfterFunc(100*time.Millisecond, cancel)
	start := time.Now()
	_, err = host.LintBatch(ctx, program, options, lifecycleRules("hang"), files[:1])
	timer.Stop()
	cancel()
	assert.Assert(t, errors.Is(err, context.Canceled), "%v", err)
	assert.Assert(t, time.Since(start) < 4*time.Second)
	_, err = host.LintBatch(t.Context(), program, options, lifecycleRules("normal"), files[:1])
	assert.NilError(t, err)
	assert.Equal(t, host.nextID, 2)
}

func TestLintHostConcurrentCancellationStorm(t *testing.T) {
	t.Parallel()
	host, options, program, files := newLifecycleHost(t, 2)
	first, err := host.acquire(t.Context())
	assert.NilError(t, err)
	second, err := host.acquire(t.Context())
	assert.NilError(t, err)
	for _, worker := range []*lintWorker{first, second} {
		assert.NilError(t, host.execute(t.Context(), worker, struct {
			Kind string `json:"kind"`
			linthost.PluginOptions
		}{"inspectPlugins", options}, nil))
	}
	host.release(first)
	host.release(second)
	var wg sync.WaitGroup
	for index := range 16 {
		wg.Go(func() {
			ctx, cancel := context.WithCancel(t.Context())
			defer cancel()
			mode := "normal"
			if index%2 == 0 {
				mode = "sleep"
				timer := time.AfterFunc(20*time.Millisecond, cancel)
				defer timer.Stop()
			}
			result, workErr := host.LintBatch(ctx, program, options, lifecycleRules(mode), files[index%len(files):index%len(files)+1])
			if index%2 == 0 {
				assert.Assert(t, errors.Is(workErr, context.Canceled), "%v", workErr)
			} else {
				assert.NilError(t, workErr)
				assert.Equal(t, result.Files[0].Error, "")
				assert.Assert(t, len(result.Files[0].Messages) != 0)
				assert.Assert(t, strings.HasPrefix(result.Files[0].Messages[0].Message, "worker="))
			}
		})
	}
	wg.Wait()
	assert.Equal(t, host.nextID, 2)
}
