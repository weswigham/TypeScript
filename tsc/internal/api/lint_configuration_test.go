package api

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/compiler"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/ipc"
	"github.com/microsoft/TypeScript/tsc/internal/json"
	"github.com/microsoft/TypeScript/tsc/internal/jsonrpc"
	"github.com/microsoft/TypeScript/tsc/internal/project"
	"github.com/microsoft/TypeScript/tsc/internal/tsoptions"
	"github.com/microsoft/TypeScript/tsc/internal/tspath"
	"gotest.tools/v3/assert"
)

type capturedLintRequest struct {
	Configuration json.Value `json:"configuration"`
	Files         []struct {
		FileName string `json:"fileName"`
	} `json:"files"`
	Snapshot struct {
		Snapshot SnapshotID `json:"snapshot"`
		Projects []struct {
			Handle            project.Handle `json:"handle"`
			CurrentDirectory  string         `json:"currentDirectory"`
			ParsedCommandLine json.Value     `json:"parsedCommandLine"`
		} `json:"projects"`
	} `json:"snapshot"`
}

type capturingLintProtocol struct {
	ipc.Protocol
	requests []capturedLintRequest
}

func (p *capturingLintProtocol) WriteRequest(id *jsonrpc.ID, method string, params any) error {
	data, err := json.Marshal(params)
	if err != nil {
		return err
	}
	var envelope struct {
		Request capturedLintRequest `json:"request"`
	}
	if err := json.Unmarshal(data, &envelope); err != nil {
		return err
	}
	p.requests = append(p.requests, envelope.Request)
	return p.Protocol.WriteRequest(id, method, params)
}

func captureLifecycleWorker(t *testing.T, host *lintHost) (*lintWorker, *capturingLintProtocol) {
	t.Helper()
	worker, err := host.acquire(t.Context())
	assert.NilError(t, err)
	protocol := &capturingLintProtocol{Protocol: NewMessagePackProtocol(worker.stream)}
	worker.conn = ipc.NewSyncConn(worker.stream, protocol, worker.session)
	host.release(worker)
	return worker, protocol
}

func lifecycleProgramOptions(program *compiler.Program, options *core.CompilerOptions) *compiler.Program {
	if !options.NoLib.IsTrue() {
		options.Lib = program.CommandLine().CompilerOptions().Lib
	}
	config := tsoptions.NewParsedCommandLine(options, program.CommandLine().FileNames(), nil, program.GetCurrentDirectory(), tspath.CaseSensitive)
	return compiler.NewProgram(compiler.ProgramOptions{Config: config, Host: program.Host()})
}

func TestLintHostReusesOnlyUnchangedWorkerConfiguration(t *testing.T) {
	t.Parallel()
	host, options, original, files := newLifecycleHost(t, 1)
	worker, protocol := captureLifecycleWorker(t, host)
	program := lifecycleProgramOptions(original, &core.CompilerOptions{NoCheck: core.TSTrue, Strict: core.TSFalse})
	rules := lifecycleRules("configuration")
	run := func(index int, severity int, message string) capturedLintRequest {
		t.Helper()
		file := program.GetSourceFile(files[index].FileName())
		result, err := host.LintBatch(t.Context(), program, options, rules, []*ast.SourceFile{file})
		assert.NilError(t, err)
		assert.Equal(t, result.Files[0].Error, "")
		assert.Equal(t, len(result.Files[0].Messages), 1)
		assert.Equal(t, result.Files[0].Messages[0].Severity, severity)
		assert.Equal(t, result.Files[0].Messages[0].Message, message)
		return protocol.requests[len(protocol.requests)-1]
	}
	first := run(0, 2, "strict=false")
	assert.Equal(t, first.Configuration[0], byte('{'))
	assert.Equal(t, first.Snapshot.Projects[0].ParsedCommandLine[0], byte('{'))
	var configuration struct {
		ResolvedLibraries []string `json:"resolvedLibraries"`
	}
	assert.NilError(t, json.Unmarshal(first.Configuration, &configuration))
	var libraries []string
	for _, file := range program.GetSourceFiles() {
		if program.IsSourceFileDefaultLibrary(file.PathKey()) {
			libraries = append(libraries, file.FileName().AsString())
		}
	}
	assert.Assert(t, len(libraries) != 0)
	assert.DeepEqual(t, configuration.ResolvedLibraries, libraries)
	second := run(1, 2, "strict=false")
	assert.Equal(t, string(second.Configuration), `"reuse"`)
	assert.Equal(t, string(second.Snapshot.Projects[0].ParsedCommandLine), `"reuse"`)
	assert.Assert(t, first.Snapshot.Snapshot != second.Snapshot.Snapshot)
	assert.Equal(t, second.Snapshot.Projects[0].Handle, first.Snapshot.Projects[0].Handle)
	assert.Equal(t, second.Snapshot.Projects[0].CurrentDirectory, program.GetCurrentDirectory().AsString())
	assert.Equal(t, second.Files[0].FileName, files[1].FileName().AsString())

	rules["lifecycle/probe"] = []any{"warn", "configuration"}
	changedRules := run(0, 1, "strict=false")
	assert.Equal(t, changedRules.Configuration[0], byte('{'))
	assert.Equal(t, string(changedRules.Snapshot.Projects[0].ParsedCommandLine), `"reuse"`)
	options.CompilerOptions = map[string]any{"lib": []string{}}
	changedOptions := run(0, 1, "strict=false")
	assert.Equal(t, changedOptions.Configuration[0], byte('{'))
	assert.Equal(t, string(changedOptions.Snapshot.Projects[0].ParsedCommandLine), `"reuse"`)

	program = lifecycleProgramOptions(original, &core.CompilerOptions{NoCheck: core.TSTrue, Strict: core.TSTrue})
	changedNative := run(0, 1, "strict=true")
	assert.Equal(t, string(changedNative.Configuration), `"reuse"`)
	assert.Equal(t, changedNative.Snapshot.Projects[0].ParsedCommandLine[0], byte('{'))
	program = lifecycleProgramOptions(original, &core.CompilerOptions{NoCheck: core.TSTrue, Strict: core.TSTrue, NoLib: core.TSTrue})
	changedLibraries := run(0, 1, "strict=true")
	assert.Equal(t, changedLibraries.Configuration[0], byte('{'))
	assert.NilError(t, json.Unmarshal(changedLibraries.Configuration, &configuration))
	assert.Equal(t, len(configuration.ResolvedLibraries), 0)

	retired, err := host.acquire(t.Context())
	assert.NilError(t, err)
	assert.Assert(t, retired == worker)
	assert.ErrorContains(t, host.retireWorker(retired, errors.New("retiring configured worker")), "retiring configured worker")
	replacement, replacementProtocol := captureLifecycleWorker(t, host)
	assert.Assert(t, replacement != worker)
	worker, protocol = replacement, replacementProtocol
	recreated := run(0, 1, "strict=true")
	assert.Equal(t, recreated.Configuration[0], byte('{'))
	assert.Equal(t, recreated.Snapshot.Projects[0].ParsedCommandLine[0], byte('{'))

	host.Invalidate()
	replacement, replacementProtocol = captureLifecycleWorker(t, host)
	assert.Assert(t, replacement != worker)
	protocol = replacementProtocol
	restarted := run(0, 1, "strict=true")
	assert.Equal(t, restarted.Configuration[0], byte('{'))
	assert.Equal(t, restarted.Snapshot.Projects[0].ParsedCommandLine[0], byte('{'))
}

func TestLintHostResendsConfigurationAfterCancellation(t *testing.T) {
	t.Parallel()
	host, options, program, files := newLifecycleHost(t, 1)
	_, protocol := captureLifecycleWorker(t, host)
	_, err := host.LintBatch(t.Context(), program, options, lifecycleRules("normal"), files[:1])
	assert.NilError(t, err)
	ctx, cancel := context.WithCancel(t.Context())
	timer := time.AfterFunc(30*time.Millisecond, cancel)
	_, err = host.LintBatch(ctx, program, options, lifecycleRules("sleep"), files)
	timer.Stop()
	cancel()
	assert.Assert(t, errors.Is(err, context.Canceled), "%v", err)
	_, err = host.LintBatch(t.Context(), program, options, lifecycleRules("normal"), files[:1])
	assert.NilError(t, err)
	assert.Equal(t, len(protocol.requests), 3)
	last := protocol.requests[2]
	assert.Equal(t, last.Configuration[0], byte('{'))
	assert.Equal(t, last.Snapshot.Projects[0].ParsedCommandLine[0], byte('{'))
	assert.Equal(t, host.nextID, 1)
}

func TestLintWorkerValidatesConfigurationReuseSentinels(t *testing.T) {
	t.Parallel()
	host, options, program, files := newLifecycleHost(t, 1)
	worker, err := host.acquire(t.Context())
	assert.NilError(t, err)
	for _, test := range []struct {
		configuration any
		expectedError string
	}{
		{"reuse", "Cannot reuse native lint configuration before receiving one"},
		{"not-a-sentinel", "Native lint configuration must be an object"},
		{lintWorkConfiguration{PluginOptions: options, Rules: lifecycleRules("normal")}, "Cannot reuse native parsed command line before receiving one"},
	} {
		err = host.execute(t.Context(), worker, map[string]any{
			"kind": "lint", "configuration": test.configuration,
			"snapshot": map[string]any{"projects": []any{map[string]any{"parsedCommandLine": "reuse"}}},
		}, nil)
		assert.ErrorContains(t, err, test.expectedError)
		assert.Assert(t, !worker.retired)
	}
	host.release(worker)
	result, err := host.LintBatch(t.Context(), program, options, lifecycleRules("normal"), files[:1])
	assert.NilError(t, err)
	assert.Equal(t, result.Files[0].Error, "")
	assert.Equal(t, len(result.Files[0].Messages), 1)
}
