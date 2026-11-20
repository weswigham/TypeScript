package tsc

import (
	"bytes"
	"context"
	"errors"
	"io"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/bundled"
	"github.com/microsoft/TypeScript/tsc/internal/compiler"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/diagnosticwriter"
	"github.com/microsoft/TypeScript/tsc/internal/execute/incremental"
	"github.com/microsoft/TypeScript/tsc/internal/lint"
	"github.com/microsoft/TypeScript/tsc/internal/locale"
	"github.com/microsoft/TypeScript/tsc/internal/parser"
	"github.com/microsoft/TypeScript/tsc/internal/tsoptions"
	"github.com/microsoft/TypeScript/tsc/internal/tspath"
	"github.com/microsoft/TypeScript/tsc/internal/vfs"
	"github.com/microsoft/TypeScript/tsc/internal/vfs/vfstest"
	"gotest.tools/v3/assert"
)

type lintReadOnlyFS struct {
	vfs.FS
}

func (fs lintReadOnlyFS) WriteFile(name tspath.RootedFilePath, text string) error {
	return errors.New("read-only filesystem")
}

func TestLintFixWriteFailure(t *testing.T) {
	t.Parallel()
	fs := lintReadOnlyFS{bundled.WrapFS(vfstest.FromMap(map[string]any{"/project/input.ts": "debugger;"}, tspath.CaseSensitive))}
	config := tsoptions.NewParsedCommandLine(&core.CompilerOptions{LintOnly: core.TSTrue, Fix: core.TSTrue}, []tspath.RootedFilePath{"/project/input.ts"}, nil, "/project", tspath.CaseSensitive)
	config.ParsedConfig.Lint = &tsoptions.LintOptions{Rules: map[string]string{"no-debugger": "error"}}
	program := compiler.NewProgram(compiler.ProgramOptions{Config: config, Host: compiler.NewCompilerHost(fs, bundled.LibPath(), nil, nil, nil)})
	sys := &timingTestSystem{fs: fs, clock: &controlledClock{now: time.Unix(0, 0)}}
	result, _ := EmitAndReportStatistics(t.Context(), EmitInput{
		Sys: sys, Program: program, ProgramLike: program, Config: config,
		ReportDiagnostic: QuietDiagnosticReporter, ReportErrorSummary: QuietDiagnosticsReporter,
		Writer: io.Discard, CompileTimes: &CompileTimes{},
	})
	assert.Equal(t, result.Status, ExitStatusDiagnosticsPresent_OutputsSkipped)
	assert.Assert(t, core.Some(result.Diagnostics, func(item *ast.Diagnostic) bool {
		return item.Code() == diagnostics.Unexpected_debugger_statement.Code()
	}))
	assert.Assert(t, core.Some(result.Diagnostics, func(item *ast.Diagnostic) bool {
		return item.Code() == diagnostics.Could_not_write_file_0_Colon_1.Code()
	}))
	text, ok := fs.ReadFile("/project/input.ts")
	assert.Assert(t, ok)
	assert.Equal(t, text, "debugger;")
}

func TestLintFixStaleSource(t *testing.T) {
	t.Parallel()
	fs := vfstest.FromMap(map[string]any{"/project/input.ts": "debugger;"}, tspath.CaseSensitive)
	config := tsoptions.NewParsedCommandLine(&core.CompilerOptions{LintOnly: core.TSTrue, NoLib: core.TSTrue}, []tspath.RootedFilePath{"/project/input.ts"}, nil, "/project", tspath.CaseSensitive)
	config.ParsedConfig.Lint = &tsoptions.LintOptions{Rules: map[string]string{"no-debugger": "error"}}
	program := compiler.NewProgram(compiler.ProgramOptions{Config: config, Host: compiler.NewCompilerHost(fs, "/lib", nil, nil, nil)})
	items := lint.GetDiagnostics(t.Context(), program)
	assert.Equal(t, len(items), 1)
	assert.NilError(t, fs.WriteFile("/project/input.ts", "export {};"))
	changed, errors := ApplyLintFixes(fs, program, items)
	assert.Equal(t, len(changed), 0)
	assert.Equal(t, len(errors), 1)
	text, ok := fs.ReadFile("/project/input.ts")
	assert.Assert(t, ok)
	assert.Equal(t, text, "export {};")
}

type diagnosticWriteCounter struct {
	bytes.Buffer
	writes int
}

func (writer *diagnosticWriteCounter) Write(data []byte) (int, error) {
	writer.writes++
	return writer.Buffer.Write(data)
}

func TestDiagnosticReporterWritesCompleteDiagnostic(t *testing.T) {
	t.Parallel()
	for _, pretty := range []bool{false, true} {
		name := "plain"
		if pretty {
			name = "pretty"
		}
		t.Run(name, func(t *testing.T) {
			t.Parallel()
			const source = "const value = '\U0001F642'; debugger;\r\n"
			file := parser.ParseSourceFile(ast.SourceFileParseOptions{FileName: "/project/input.ts", PathKey: "/project/input.ts"}, source, core.ScriptKindTS)
			diagnostic := ast.NewDiagnostic(file, core.NewTextRange(strings.Index(source, "debugger"), len(source)-2), diagnostics.Unexpected_debugger_statement).
				AddRelatedInfo(ast.NewDiagnostic(file, core.NewTextRange(0, 5), diagnostics.Cannot_find_name_0, "missing"))
			sys := &timingTestSystem{fs: vfstest.FromMap(map[string]string{"/project/input.ts": source}, tspath.CaseSensitive)}
			options := &core.CompilerOptions{Pretty: core.BoolToTristate(pretty)}
			var expected strings.Builder
			formatOptions := getFormatOptsOfSys(sys, locale.Default)
			if pretty {
				diagnosticwriter.FormatDiagnosticWithColorAndContext(&expected, diagnosticwriter.WrapASTDiagnostic(diagnostic), formatOptions)
				expected.WriteString(formatOptions.NewLine)
			} else {
				diagnosticwriter.WriteFormatDiagnostic(&expected, diagnosticwriter.WrapASTDiagnostic(diagnostic), formatOptions)
			}
			var actual diagnosticWriteCounter
			CreateDiagnosticReporter(sys, &actual, locale.Default, options)(diagnostic)
			assert.Equal(t, actual.String(), expected.String())
			assert.Equal(t, actual.writes, 1)
		})
	}
}

func TestFormattingDiagnosticsDoNotBlockEmit(t *testing.T) {
	t.Parallel()
	for _, incrementalMode := range []bool{false, true} {
		name := "regular"
		if incrementalMode {
			name = "incremental"
		}
		t.Run(name, func(t *testing.T) {
			t.Parallel()
			for _, test := range []struct {
				name        string
				text        string
				emitSkipped bool
			}{
				{"formatting only", "export const value=1;\n", false},
				{"semantic error still blocks emit", "export const value:string=1;\n", true},
			} {
				t.Run(test.name, func(t *testing.T) {
					t.Parallel()
					fs := bundled.WrapFS(vfstest.FromMap(map[string]any{"/project/input.ts": test.text}, tspath.CaseSensitive))
					sys := &timingTestSystem{fs: fs, clock: &controlledClock{now: time.Unix(0, 0)}}
					options := &core.CompilerOptions{
						Format:            core.TSTrue,
						FormatDiagnostics: core.TSTrue,
						NoEmitOnError:     core.TSTrue,
						Declaration:       core.TSTrue,
						Incremental:       core.BoolToTristate(incrementalMode),
					}
					if incrementalMode {
						options.TsBuildInfoFile = "/project/cache.tsbuildinfo"
					}
					config := tsoptions.NewParsedCommandLine(options, []tspath.RootedFilePath{"/project/input.ts"}, nil, "/project", tspath.CaseSensitive)
					host := compiler.NewCompilerHost(fs, bundled.LibPath(), nil, nil, nil)
					formatted := FormatInputFiles(t.Context(), host, config)
					assert.Assert(t, len(formatted.Diagnostics) > 0)
					program := compiler.NewProgram(compiler.ProgramOptions{Config: config, Host: WithFormattingSourceFiles(host, formatted.SourceFiles)})
					var programLike compiler.ProgramLike = program
					if incrementalMode {
						programLike = incremental.NewProgram(program, nil, incremental.CreateHost(host), sys.Now, false)
					}
					result, _ := EmitAndReportStatistics(t.Context(), EmitInput{
						Sys:                   sys,
						Program:               program,
						ProgramLike:           programLike,
						Config:                config,
						FormattingDiagnostics: formatted.Diagnostics,
						ReportDiagnostic:      QuietDiagnosticReporter,
						ReportErrorSummary:    QuietDiagnosticsReporter,
						Writer:                io.Discard,
						CompileTimes:          &CompileTimes{},
					})
					assert.Equal(t, result.EmitResult.EmitSkipped, test.emitSkipped)
					assert.Equal(t, len(result.CompilationDiagnostics) > 0, test.emitSkipped)
					expectedStatus := ExitStatusDiagnosticsPresent_OutputsGenerated
					if test.emitSkipped {
						expectedStatus = ExitStatusDiagnosticsPresent_OutputsSkipped
					}
					assert.Equal(t, result.Status, expectedStatus)
					assert.Equal(t, fs.FileExists("/project/input.js"), !test.emitSkipped)
					assert.Equal(t, fs.FileExists("/project/input.d.ts"), !test.emitSkipped)
					assert.Assert(t, core.Some(result.Diagnostics, func(d *ast.Diagnostic) bool {
						return d.Code() == diagnostics.Expected_a_space_before_the_binary_operator_1.Code()
					}))
					assert.Equal(t, core.Some(result.Diagnostics, func(d *ast.Diagnostic) bool { return d.Code() == 2322 }), test.emitSkipped)
					text, ok := fs.ReadFile("/project/input.ts")
					assert.Assert(t, ok)
					assert.Equal(t, text, test.text)
				})
			}
		})
	}
}

func TestEmitCancellation(t *testing.T) {
	t.Parallel()
	for _, mode := range []string{"regular", "incremental"} {
		t.Run(mode, func(t *testing.T) {
			t.Parallel()
			fs := vfstest.FromMap(map[string]string{"/project/input.ts": "export const value = 1;"}, tspath.CaseSensitive)
			sys := &timingTestSystem{fs: fs, clock: &controlledClock{now: time.Unix(0, 0)}}
			options := &core.CompilerOptions{NoLib: core.TSTrue}
			if mode == "incremental" {
				options.Incremental = core.TSTrue
				options.TsBuildInfoFile = "/project/cache.tsbuildinfo"
			}
			config := tsoptions.NewParsedCommandLine(options, []tspath.RootedFilePath{"/project/input.ts"}, nil, "/project", tspath.CaseSensitive)
			host := compiler.NewCompilerHost(fs, "/lib", nil, nil, nil)
			program := compiler.NewProgram(compiler.ProgramOptions{Config: config, Host: host})
			var programLike compiler.ProgramLike = program
			if mode == "incremental" {
				programLike = incremental.NewProgram(program, nil, incremental.CreateHost(host), sys.Now, false)
			}
			ctx, cancel := context.WithCancel(t.Context())
			cancel()
			result, statistics := EmitAndReportStatistics(ctx, EmitInput{
				Sys: sys, Program: program, ProgramLike: programLike, Config: config,
				ReportDiagnostic: QuietDiagnosticReporter, ReportErrorSummary: QuietDiagnosticsReporter,
				Writer: io.Discard, CompileTimes: &CompileTimes{},
			})
			assert.Equal(t, result.Status, ExitStatusDiagnosticsPresent_OutputsSkipped)
			assert.Assert(t, result.EmitResult != nil && result.EmitResult.EmitSkipped)
			assert.Assert(t, !fs.FileExists("/project/input.js"))
			assert.Assert(t, !fs.FileExists("/project/cache.tsbuildinfo"))
			assert.Assert(t, statistics == nil)
		})
	}
}

type contentMapperLoggingTestSystem struct {
	*timingTestSystem
	enabled bool
	stderr  bytes.Buffer
}

func (s *contentMapperLoggingTestSystem) GetEnvironmentVariable(name string) (string, bool) {
	if name == "TS_CONTENT_MAPPER_DEBUG" && s.enabled {
		return "1", true
	}
	return "", false
}

func (s *contentMapperLoggingTestSystem) ErrorWriter() io.Writer {
	return &s.stderr
}

func TestContentMapperLoggerEnvironmentVariable(t *testing.T) {
	t.Parallel()
	sys := &contentMapperLoggingTestSystem{timingTestSystem: &timingTestSystem{}}
	assert.Assert(t, newContentMapperLogger(sys) == nil)
	sys.enabled = true
	logger := newContentMapperLogger(sys)
	assert.Assert(t, logger != nil)
	var wg sync.WaitGroup
	for range 10 {
		wg.Go(func() { logger("mapper log") })
	}
	wg.Wait()
	assert.Equal(t, sys.stderr.String(), strings.Repeat("mapper log\n", 10))
}

type controlledClock struct {
	mu                   sync.Mutex
	now                  time.Time
	nestedEmitInProgress bool
	nestedEmitCalls      int
}

type fileClock struct {
	mu  sync.Mutex
	now time.Time
}

func (c *fileClock) Now() time.Time {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.now = c.now.Add(time.Second)
	return c.now
}

func (c *fileClock) SinceStart() time.Duration {
	return 0
}

func (c *controlledClock) Now() time.Time {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.now
}

func (c *controlledClock) NestedEmitNow() time.Time {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.nestedEmitCalls++
	if c.nestedEmitInProgress {
		c.now = c.now.Add(time.Second)
	}
	c.nestedEmitInProgress = !c.nestedEmitInProgress
	return c.now
}

func (c *controlledClock) NestedEmitCalls() int {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.nestedEmitCalls
}

func (c *controlledClock) SinceStart() time.Duration {
	return 0
}

type timingTestSystem struct {
	fs    vfs.FS
	clock *controlledClock
}

func (s *timingTestSystem) Writer() io.Writer                               { return io.Discard }
func (s *timingTestSystem) ErrorWriter() io.Writer                          { return io.Discard }
func (s *timingTestSystem) FS() vfs.FS                                      { return s.fs }
func (s *timingTestSystem) DefaultLibraryPath() tspath.RootedDirectoryPath  { return "/lib" }
func (s *timingTestSystem) GetCurrentDirectory() tspath.RootedDirectoryPath { return "/project" }
func (s *timingTestSystem) WriteOutputIsTTY() bool                          { return false }
func (s *timingTestSystem) GetWidthOfTerminal() int                         { return 0 }
func (s *timingTestSystem) GetEnvironmentVariable(name string) (string, bool) {
	return "", false
}
func (s *timingTestSystem) Now() time.Time            { return s.clock.Now() }
func (s *timingTestSystem) SinceStart() time.Duration { return s.clock.SinceStart() }

func (s *timingTestSystem) Spawn([]string, string, io.Writer) (io.ReadWriteCloser, error) {
	return nil, errors.New("spawn not implemented in timingTestSystem")
}

func (s *timingTestSystem) Run(context.Context, []string, string, io.Writer, io.Writer) error {
	return errors.New("run not implemented in timingTestSystem")
}

func TestIncrementalDeclarationEmitTimeIsExcludedFromCheckTime(t *testing.T) {
	t.Parallel()

	files := map[string]string{
		"/lib/lib.d.ts": `
interface Array<T> {}
interface Boolean {}
interface CallableFunction {}
interface Function {}
interface IArguments {}
interface NewableFunction {}
interface Number {}
interface Object {}
interface RegExp {}
interface String {}
`,
		"/project/hub.ts": `
export interface Box {
    value: string;
}
export const make = (): Box => ({ value: "ok" });
`,
		"/project/spoke.ts": `import { make, type Box } from "./hub"; export const value: Box = make();`,
	}
	clock := &controlledClock{now: time.Unix(0, 0)}
	sys := &timingTestSystem{
		fs:    vfstest.FromMapWithClock(files, tspath.CaseSensitive, &fileClock{}),
		clock: clock,
	}
	options := &core.CompilerOptions{
		Declaration:     core.TSTrue,
		Incremental:     core.TSTrue,
		Module:          core.ModuleKindESNext,
		NoEmit:          core.TSTrue,
		TsBuildInfoFile: "/project/tsconfig.tsbuildinfo",
	}
	currentDirectory := tspath.RootedDirectoryPath("/project")
	config := tsoptions.NewParsedCommandLine(options, core.Map([]string{"/lib/lib.d.ts", "/project/hub.ts", "/project/spoke.ts"}, func(fileName string) tspath.RootedFilePath {
		return tspath.ToRootedFilePath(fileName, currentDirectory)
	}), nil, currentDirectory, tspath.CaseSensitive)

	compile := func(oldProgram *incremental.Program) (*incremental.Program, *CompileTimes) {
		host := compiler.NewCachedFSCompilerHost(sys.FS(), sys.DefaultLibraryPath(), nil, nil, nil)
		program := compiler.NewProgram(compiler.ProgramOptions{
			Config: config,
			Host:   host,
		})
		if program.GetSourceFile("/lib/lib.d.ts") == nil {
			t.Fatal("default library was not loaded")
		}
		incrementalProgram := incremental.NewProgram(program, oldProgram, incremental.CreateHost(host), clock.NestedEmitNow, false)
		times := &CompileTimes{}
		EmitFilesAndReportErrors(t.Context(), EmitInput{
			Sys:                sys,
			ProgramLike:        incrementalProgram,
			Program:            program,
			Config:             config,
			ReportDiagnostic:   QuietDiagnosticReporter,
			ReportErrorSummary: QuietDiagnosticsReporter,
			Writer:             io.Discard,
			WriteFile: func(fileName tspath.RootedFilePath, text string, data *compiler.WriteFileData) error {
				return sys.fs.WriteFile(fileName, text)
			},
			CompileTimes: times,
		})
		return incrementalProgram, times
	}
	oldProgram, _ := compile(nil)
	if err := sys.fs.WriteFile("/project/hub.ts", files["/project/hub.ts"]+"\n// comment only change\n"); err != nil {
		t.Fatal(err)
	}
	_, times := compile(oldProgram)

	if times.checkTime != 0 {
		t.Fatalf("check time = %v, want 0", times.checkTime)
	}
	if times.emitTime != 2*time.Second {
		t.Fatalf("emit time = %v, want %v", times.emitTime, 2*time.Second)
	}
	if calls := clock.NestedEmitCalls(); calls != 4 {
		t.Fatalf("nested clock calls = %d, want 4", calls)
	}
}
