package tsc

import (
	"bytes"
	"context"
	"errors"
	"io"
	"strings"
	"sync/atomic"
	"testing"
	"time"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/compiler"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/tsoptions"
	"github.com/microsoft/TypeScript/tsc/internal/tspath"
	"github.com/microsoft/TypeScript/tsc/internal/vfs"
	"github.com/microsoft/TypeScript/tsc/internal/vfs/vfstest"
	"gotest.tools/v3/assert"
)

func TestGenerationArguments(t *testing.T) {
	t.Parallel()
	step := tsoptions.GenerateCommand{
		Inputs:  []string{"src/**/*.test.ts", "other.ts"},
		Outputs: []string{"src/**/*.mock.ts"},
		Command: []string{"node", "generate.js", "${inputs}"},
	}
	assert.DeepEqual(t, generationArguments(step), []string{"node", "generate.js", "src/**/*.test.ts", "other.ts"})
}

func TestGenerationLiteralDirectories(t *testing.T) {
	t.Parallel()
	for _, root := range []tspath.RootedDirectoryPath{"/workspace[demo]/project", "/workspace{demo}/project"} {
		t.Run(root.AsString(), func(t *testing.T) {
			t.Parallel()
			input := root.ResolveFile("../inputs/nested/data.json")
			output := root.ResolveFile("generated/output.ts")
			fs := vfstest.FromMap(map[string]any{input.AsString(): "{}", output.AsString(): "export const value = 1;"}, tspath.CaseSensitive)
			plan := tsoptions.NewGenerationPlan([]tsoptions.GenerateCommand{{Directory: root, Inputs: []string{"../inputs/**/*.json"}, Outputs: []string{"generated/*.ts"}}}, fs.CaseSensitivity())
			assert.DeepEqual(t, plan.Commands[0].Inputs[0].Files(fs), []tspath.RootedFilePath{input})
			assert.DeepEqual(t, plan.OutputFiles(fs), []tspath.RootedFilePath{output})
			commands := []tsoptions.GenerateCommand{
				{Directory: root, Outputs: []string{"generated/*.ts"}},
				{Directory: root, Outputs: []string{"generated/*.js"}},
			}
			assert.Equal(t, len(ValidateGenerationOutputs(fs, commands)), 0)
			commands[1].Outputs = []string{"generated/output.ts"}
			assert.Equal(t, len(ValidateGenerationOutputs(fs, commands)), 1)
		})
	}
}

func TestGenerationDirectoryChanges(t *testing.T) {
	t.Parallel()
	fs := vfstest.FromMap(map[string]any{"/project/main.ts": "", "/templates/keep.json": "{}"}, tspath.CaseSensitive)
	config := tsoptions.NewParsedCommandLine(&core.CompilerOptions{Generate: core.TSTrue}, nil, nil, "/project", tspath.CaseSensitive)
	config.ParsedConfig.Generate = []tsoptions.GenerateCommand{{Directory: "/project", Inputs: []string{"../templates/**/*.json"}, Outputs: []string{"generated/*.ts"}}}
	assert.Assert(t, GenerationMatchesPath(fs, config, "/templates/nested"))
	assert.Assert(t, GenerationMatchesPath(fs, config, "/templates"))
	assert.Assert(t, !GenerationMatchesPath(fs, config, "/unrelated/nested"))
}

func TestGenerationRejectsCommandDependencies(t *testing.T) {
	t.Parallel()
	fs := vfstest.FromMap(map[string]any{}, tspath.CaseSensitive)
	commands := []tsoptions.GenerateCommand{
		{Directory: "/project", Inputs: []string{"input.json"}, Outputs: []string{"generated/*.json"}},
		{Directory: "/project", Inputs: []string{"generated/intermediate.json"}, Outputs: []string{"output.ts"}},
	}
	errors := tsoptions.NewGenerationPlan(commands, fs.CaseSensitivity()).DependencyDiagnostics(fs)
	assert.Equal(t, len(errors), 1)
	assert.Equal(t, errors[0].Code(), int32(18172))
}

func TestGenerationTimingAggregation(t *testing.T) {
	t.Parallel()
	first := &Statistics{compileTimes: &CompileTimes{GenerationTimes: GenerationTimings{Commands: 1, ByCommand: map[string]time.Duration{"node generate.js": time.Second}}}}
	second := &Statistics{compileTimes: &CompileTimes{GenerationTimes: GenerationTimings{Commands: 2, ByCommand: map[string]time.Duration{"node generate.js": 2 * time.Second, "node other.js": time.Second}}}}
	var aggregate Statistics
	aggregate.Aggregate(first)
	aggregate.Aggregate(second)
	assert.Equal(t, aggregate.compileTimes.GenerationTimes.Commands, 3)
	assert.Equal(t, aggregate.compileTimes.GenerationTimes.ByCommand["node generate.js"], 3*time.Second)
	var output bytes.Buffer
	aggregate.Report(&output, nil)
	assert.Assert(t, strings.Contains(output.String(), "Aggregate Generate node generate.js time:"))
}

func TestPreBuildStageOrdering(t *testing.T) {
	t.Parallel()
	fs := vfstest.FromMap(map[string]any{"/project/input.json": "1"}, tspath.CaseSensitive)
	config := tsoptions.NewParsedCommandLine(&core.CompilerOptions{
		Generate: core.TSTrue, Format: core.TSTrue, RunExternalCode: core.TSTrue, Incremental: core.TSTrue, TsBuildInfoFile: "/project/cache.tsbuildinfo", NoLib: core.TSTrue,
	}, []tspath.RootedFilePath{"/project/output.ts"}, nil, "/project", tspath.CaseSensitive)
	config.ParsedConfig.Generate = []tsoptions.GenerateCommand{{Directory: "/project", Inputs: []string{"input.json"}, Outputs: []string{"output.ts"}, Command: []string{"node", "generate.js"}}}
	var order []string
	sys := &generationTestSystem{fs: fs, spawn: func(command []string, directory string, stderr io.Writer) (io.ReadWriteCloser, error) {
		order = append(order, "generate")
		assert.NilError(t, fs.WriteFile("/project/output.ts", "export const value=1;\n"))
		return &generationTestProcess{Reader: strings.NewReader("")}, nil
	}}
	input := PreBuildInput{
		Sys: sys, Config: config, Writer: io.Discard,
		OnGenerated: func() { order = append(order, "invalidate") },
		Format: func(ctx context.Context, config *tsoptions.ParsedCommandLine) (FormatResult, *ast.Diagnostic) {
			order = append(order, "format")
			return FormatInputFiles(ctx, compiler.NewCompilerHost(fs, "/lib", nil, nil, nil), config), nil
		},
	}
	for range 2 {
		result := RunPreBuildStages(t.Context(), input)
		assert.Equal(t, result.Status, PreBuildContinue)
		assert.Equal(t, len(result.Diagnostics), 0)
	}
	assert.DeepEqual(t, order, []string{"generate", "invalidate", "format", "format"})
}

func TestGenerationDoesNotCacheChangedInputs(t *testing.T) {
	t.Parallel()
	fs := vfstest.FromMap(map[string]any{"/project/input.json": "1"}, tspath.CaseSensitive)
	config := tsoptions.NewParsedCommandLine(&core.CompilerOptions{
		GenerateOnly: core.TSTrue, RunExternalCode: core.TSTrue, Incremental: core.TSTrue, TsBuildInfoFile: "/project/cache.tsbuildinfo", NoLib: core.TSTrue,
	}, nil, nil, "/project", tspath.CaseSensitive)
	config.ParsedConfig.Generate = []tsoptions.GenerateCommand{{Directory: "/project", Inputs: []string{"input.json"}, Outputs: []string{"output.ts"}, Command: []string{"node", "generate.js"}}}
	var calls atomic.Int32
	sys := &generationTestSystem{fs: fs, spawn: func(command []string, directory string, stderr io.Writer) (io.ReadWriteCloser, error) {
		value, _ := fs.ReadFile("/project/input.json")
		assert.NilError(t, fs.WriteFile("/project/output.ts", "export const value = "+value+";\n"))
		if calls.Add(1) == 1 {
			assert.NilError(t, fs.WriteFile("/project/input.json", "2"))
		}
		return &generationTestProcess{Reader: strings.NewReader("")}, nil
	}}
	for range 2 {
		result := Generate(t.Context(), sys, config, io.Discard, nil)
		assert.Equal(t, len(result.Diagnostics), 0)
		result.Save(sys, config)
		assert.Equal(t, len(result.Diagnostics), 0)
	}
	assert.Equal(t, calls.Load(), int32(2))
	text, _ := fs.ReadFile("/project/output.ts")
	assert.Equal(t, text, "export const value = 2;\n")
}

func TestGenerationDoesNotCacheChangedFormattedInputs(t *testing.T) {
	t.Parallel()
	fs := vfstest.FromMap(map[string]any{"/project/input.ts": "export const value=1;\n"}, tspath.CaseSensitive)
	config := tsoptions.NewParsedCommandLine(&core.CompilerOptions{
		Generate: core.TSTrue, Format: core.TSTrue, RunExternalCode: core.TSTrue, Incremental: core.TSTrue, TsBuildInfoFile: "/project/cache.tsbuildinfo", NoLib: core.TSTrue,
	}, []tspath.RootedFilePath{"/project/input.ts", "/project/output.ts"}, nil, "/project", tspath.CaseSensitive)
	config.ParsedConfig.Generate = []tsoptions.GenerateCommand{{Directory: "/project", Inputs: []string{"input.ts"}, Outputs: []string{"output.ts"}, Command: []string{"node", "generate.js"}}}
	var calls atomic.Int32
	sys := &generationTestSystem{fs: fs, spawn: func(command []string, directory string, stderr io.Writer) (io.ReadWriteCloser, error) {
		value, _ := fs.ReadFile("/project/input.ts")
		assert.NilError(t, fs.WriteFile("/project/output.ts", strings.Replace(value, "value", "seen", 1)))
		if calls.Add(1) == 1 {
			assert.NilError(t, fs.WriteFile("/project/input.ts", "export const value=2;\n"))
		}
		return &generationTestProcess{Reader: strings.NewReader("")}, nil
	}}
	for range 2 {
		result := RunPreBuildStages(t.Context(), PreBuildInput{
			Sys: sys, Config: config, Writer: io.Discard,
			Format: func(ctx context.Context, config *tsoptions.ParsedCommandLine) (FormatResult, *ast.Diagnostic) {
				return FormatInputFiles(ctx, compiler.NewCompilerHost(fs, "/lib", nil, nil, nil), config), nil
			},
		})
		assert.Equal(t, result.Status, PreBuildContinue)
		assert.Equal(t, len(result.Diagnostics), 0)
	}
	assert.Equal(t, calls.Load(), int32(2))
	text, _ := fs.ReadFile("/project/output.ts")
	assert.Equal(t, text, "export const seen = 2;\n")
}

type generationTestSystem struct {
	System
	fs    vfs.FS
	spawn func([]string, string, io.Writer) (io.ReadWriteCloser, error)
}

func (sys *generationTestSystem) FS() vfs.FS                                     { return sys.fs }
func (sys *generationTestSystem) Now() time.Time                                 { return time.Now() }
func (sys *generationTestSystem) DefaultLibraryPath() tspath.RootedDirectoryPath { return "/lib" }
func (sys *generationTestSystem) Spawn(command []string, directory string, stderr io.Writer) (io.ReadWriteCloser, error) {
	return sys.spawn(command, directory, stderr)
}

func (sys *generationTestSystem) Run(ctx context.Context, command []string, directory string, stdout, stderr io.Writer) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	process, err := sys.spawn(command, directory, stderr)
	if err != nil {
		return err
	}
	defer process.Close()
	if _, err := io.Copy(stdout, process); err != nil {
		return err
	}
	return process.(*generationTestProcess).Wait()
}

type generationTestProcess struct {
	io.Reader
	err error
}

func (process *generationTestProcess) Write(data []byte) (int, error) { return len(data), nil }
func (process *generationTestProcess) Close() error                   { return nil }
func (process *generationTestProcess) CloseInput() error              { return nil }
func (process *generationTestProcess) Wait() error                    { return process.err }

func TestGenerationStateAndFormatting(t *testing.T) {
	t.Parallel()
	for _, cached := range []bool{false, true} {
		t.Run(map[bool]string{false: "nonincremental", true: "incremental"}[cached], func(t *testing.T) {
			t.Parallel()
			fs := vfstest.FromMap(map[string]any{"/project/input.json": "{}"}, tspath.CaseSensitive)
			config := tsoptions.NewParsedCommandLine(&core.CompilerOptions{
				Generate: core.TSTrue, RunExternalCode: core.TSTrue, Format: core.TSTrue,
				Incremental: core.BoolToTristate(cached), TsBuildInfoFile: "/project/cache.tsbuildinfo", NoLib: core.TSTrue,
			}, []tspath.RootedFilePath{"/project/output.ts"}, nil, "/project", tspath.CaseSensitive)
			config.ParsedConfig.Generate = []tsoptions.GenerateCommand{{
				Inputs: []string{"input.json", "*.ts"}, Outputs: []string{"output.ts"}, Command: []string{"node", "generate.js", "${inputs}"}, Directory: "/project",
			}}
			var calls atomic.Int32
			sys := &generationTestSystem{fs: fs, spawn: func(command []string, directory string, stderr io.Writer) (io.ReadWriteCloser, error) {
				calls.Add(1)
				assert.DeepEqual(t, command, []string{"node", "generate.js", "input.json", "*.ts"})
				assert.Equal(t, directory, "/project")
				assert.NilError(t, fs.WriteFile("/project/output.ts", "export const value=1;\n"))
				return &generationTestProcess{Reader: strings.NewReader("")}, nil
			}}
			run := func() {
				generated := Generate(t.Context(), sys, config, io.Discard, nil)
				assert.Equal(t, len(generated.Diagnostics), 0)
				formatted := FormatInputFiles(t.Context(), compiler.NewCompilerHost(fs, "/lib", nil, nil, nil), config)
				assert.Equal(t, len(formatted.Diagnostics), 0)
				generated.Save(sys, config, formatted.Changes...)
				assert.Equal(t, len(generated.Diagnostics), 0)
			}
			run()
			text, _ := fs.ReadFile("/project/output.ts")
			assert.Equal(t, text, "export const value = 1;\n")
			run()
			assert.Equal(t, calls.Load(), map[bool]int32{false: 2, true: 1}[cached])
			assert.NilError(t, fs.WriteFile("/project/input.json", "{\"changed\":true}"))
			run()
			assert.Equal(t, calls.Load(), map[bool]int32{false: 3, true: 2}[cached])
			assert.NilError(t, fs.Remove("/project/output.ts"))
			run()
			assert.Equal(t, calls.Load(), map[bool]int32{false: 4, true: 3}[cached])
		})
	}
}

func TestGenerationFailures(t *testing.T) {
	t.Parallel()
	for _, test := range []struct {
		name                      string
		enabled, trusted, overlap bool
		stderr                    string
		err                       error
		wantErrors, wantCalls     int
	}{
		{name: "disabled", trusted: true},
		{name: "untrusted", enabled: true, wantErrors: 1},
		{name: "overlap", enabled: true, trusted: true, overlap: true, wantErrors: 1},
		{name: "stderr", enabled: true, trusted: true, stderr: "generation failed", wantErrors: 1, wantCalls: 1},
		{name: "exit code", enabled: true, trusted: true, err: errors.New("exit status 7"), wantErrors: 1, wantCalls: 1},
		{name: "success", enabled: true, trusted: true, wantCalls: 1},
	} {
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()
			fs := vfstest.FromMap(map[string]any{"/project/input.json": "{}"}, tspath.CaseSensitive)
			config := tsoptions.NewParsedCommandLine(&core.CompilerOptions{GenerateOnly: core.BoolToTristate(test.enabled), RunExternalCode: core.BoolToTristate(test.trusted), ExtendedDiagnostics: core.TSTrue}, nil, nil, "/project", tspath.CaseSensitive)
			config.ParsedConfig.Generate = []tsoptions.GenerateCommand{{Inputs: []string{"input.json"}, Outputs: []string{"src/foo*.ts"}, Command: []string{"node", "generate.js"}, Directory: "/project"}}
			if test.overlap {
				config.ParsedConfig.Generate = append(config.ParsedConfig.Generate, tsoptions.GenerateCommand{Inputs: []string{"input.json"}, Outputs: []string{"src/*bar.ts"}, Command: []string{"node", "other.js"}, Directory: "/project"})
			}
			var calls atomic.Int32
			sys := &generationTestSystem{fs: fs, spawn: func(command []string, directory string, stderr io.Writer) (io.ReadWriteCloser, error) {
				calls.Add(1)
				fmtOutput := test.stderr
				_, err := io.WriteString(stderr, fmtOutput)
				assert.NilError(t, err)
				return &generationTestProcess{Reader: strings.NewReader(""), err: test.err}, nil
			}}
			var output bytes.Buffer
			result := Generate(t.Context(), sys, config, &output, nil)
			assert.Equal(t, len(result.Diagnostics), test.wantErrors)
			assert.Equal(t, int(calls.Load()), test.wantCalls)
			assert.Equal(t, result.Timings.Commands, test.wantCalls)
			assert.Assert(t, !strings.Contains(output.String(), "Generate node generate.js time:"))
			ReportGenerationStatistics(&output, result.Timings, nil)
			assert.Equal(t, strings.Contains(output.String(), "Generate node generate.js time:"), test.wantCalls != 0)
		})
	}
}

func TestGenerationParallel(t *testing.T) {
	t.Parallel()
	fs := vfstest.FromMap(map[string]any{"/project/input.json": "{}"}, tspath.CaseSensitive)
	config := tsoptions.NewParsedCommandLine(&core.CompilerOptions{GenerateOnly: core.TSTrue, RunExternalCode: core.TSTrue}, nil, nil, "/project", tspath.CaseSensitive)
	for _, output := range []string{"first.ts", "second.ts"} {
		config.ParsedConfig.Generate = append(config.ParsedConfig.Generate, tsoptions.GenerateCommand{Inputs: []string{"input.json"}, Outputs: []string{output}, Command: []string{"node", output}, Directory: "/project"})
	}
	started := make(chan struct{}, 2)
	release := make(chan struct{})
	defer close(release)
	sys := &generationTestSystem{fs: fs, spawn: func(command []string, directory string, stderr io.Writer) (io.ReadWriteCloser, error) {
		started <- struct{}{}
		<-release
		return &generationTestProcess{Reader: strings.NewReader("")}, nil
	}}
	finished := make(chan GenerationResult, 1)
	go func() { finished <- Generate(t.Context(), sys, config, io.Discard, nil) }()
	for range 2 {
		select {
		case <-started:
			continue
		case <-time.After(10 * time.Second):
			t.Fatal("generation commands did not start concurrently")
		}
	}
	release <- struct{}{}
	release <- struct{}{}
	result := <-finished
	assert.Equal(t, result.Executed, 2)
	assert.Equal(t, len(result.Diagnostics), 0)
}
