package tsc

import (
	"context"
	"strconv"
	"sync/atomic"
	"testing"
	"time"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/bundled"
	"github.com/microsoft/TypeScript/tsc/internal/compiler"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/format"
	"github.com/microsoft/TypeScript/tsc/internal/ls/lsutil"
	"github.com/microsoft/TypeScript/tsc/internal/parser"
	"github.com/microsoft/TypeScript/tsc/internal/tsoptions"
	"github.com/microsoft/TypeScript/tsc/internal/tspath"
	"github.com/microsoft/TypeScript/tsc/internal/vfs"
	"github.com/microsoft/TypeScript/tsc/internal/vfs/vfstest"
	"gotest.tools/v3/assert"
)

func TestFormattingImplicitInputs(t *testing.T) {
	t.Parallel()
	fs := vfstest.FromMap(map[string]any{
		"/project/main.ts":   "import { value } from './helper';\nexport const result=value;\n",
		"/project/helper.ts": "export const value=1;\n",
	}, tspath.CaseSensitive)
	config := tsoptions.NewParsedCommandLine(&core.CompilerOptions{FormatOnly: core.TSTrue, NoLib: core.TSTrue}, []tspath.RootedFilePath{"/project/main.ts"}, nil, "/project", tspath.CaseSensitive)
	host := compiler.NewCompilerHost(fs, "/lib", nil, nil, nil)
	result := FormatInputFiles(t.Context(), host, config)
	assert.Equal(t, len(result.Diagnostics), 0)
	text, ok := fs.ReadFile("/project/helper.ts")
	assert.Assert(t, ok)
	assert.Equal(t, text, "export const value = 1;\n")
}

func TestFormattingReusesUnchangedSourceFiles(t *testing.T) {
	t.Parallel()
	for _, composite := range []bool{false, true} {
		t.Run(strconv.FormatBool(composite), func(t *testing.T) {
			t.Parallel()
			fs := vfstest.FromMap(map[string]any{
				"/project/clean.ts": "const clean = 1;\n",
				"/project/dirty.ts": "const dirty=2;\n",
			}, tspath.CaseSensitive)
			config := tsoptions.NewParsedCommandLine(&core.CompilerOptions{
				Format:          core.TSTrue,
				Composite:       core.BoolToTristate(composite),
				NoLib:           core.TSTrue,
				ModuleDetection: core.ModuleDetectionKindForce,
			}, []tspath.RootedFilePath{"/project/clean.ts", "/project/dirty.ts"}, nil, "/project", tspath.CaseSensitive)
			host := &formattingTestHost{CompilerHost: compiler.NewCompilerHost(fs, "/lib", nil, nil, nil)}
			formatted := FormatInputFiles(t.Context(), host, config)
			assert.Equal(t, len(formatted.Diagnostics), 0)
			assert.Equal(t, len(formatted.SourceFiles), 1)
			source := formatted.SourceFiles[0]
			assert.Equal(t, source.FileName(), tspath.RootedFilePath("/project/clean.ts"))
			before := host.parses.Load()
			program := compiler.NewProgram(compiler.ProgramOptions{
				Config: config,
				Host:   WithFormattingSourceFiles(host, formatted.SourceFiles),
			})
			assert.Assert(t, program.GetSourceFile("/project/clean.ts") == source)
			assert.Equal(t, host.parses.Load()-before, int32(1))
			assert.Assert(t, source.ExternalModuleIndicator != nil)
			assert.Assert(t, source.ParseOptions().ExternalModuleIndicatorOptions.Force)
			assert.Equal(t, program.GetSourceFile("/project/dirty.ts").Text(), "const dirty = 2;\n")
		})
	}
}

func TestFormattingDiagnosticsReusesUnmodifiedText(t *testing.T) {
	t.Parallel()
	fs := vfstest.FromMap(map[string]any{"/project/input.ts": "const value=1;\n"}, tspath.CaseSensitive)
	config := tsoptions.NewParsedCommandLine(&core.CompilerOptions{
		Format:            core.TSTrue,
		FormatDiagnostics: core.TSTrue,
		NoLib:             core.TSTrue,
	}, []tspath.RootedFilePath{"/project/input.ts"}, nil, "/project", tspath.CaseSensitive)
	host := &formattingTestHost{CompilerHost: compiler.NewCompilerHost(fs, "/lib", nil, nil, nil)}
	result := FormatInputFiles(t.Context(), host, config)
	assert.Equal(t, len(result.Diagnostics), 2)
	assert.Equal(t, len(result.SourceFiles), 1)
	before := host.parses.Load()
	program := compiler.NewProgram(compiler.ProgramOptions{Config: config, Host: WithFormattingSourceFiles(host, result.SourceFiles)})
	assert.Assert(t, program.GetSourceFile("/project/input.ts") == result.SourceFiles[0])
	assert.Equal(t, host.parses.Load(), before)
	assert.Equal(t, program.GetSourceFile("/project/input.ts").Text(), "const value=1;\n")
}

func TestFormattingReusesDiscoverySourceFiles(t *testing.T) {
	t.Parallel()
	fs := bundled.WrapFS(vfstest.FromMap(map[string]any{
		"/project/main.ts":                       "import type { Dependency } from \"dep\";\nexport const value = 1;\n",
		"/project/node_modules/dep/package.json": `{"name":"dep","version":"1.0.0","types":"index.d.ts"}`,
		"/project/node_modules/dep/index.d.ts":   "export interface Dependency{value:number;}\n",
	}, tspath.CaseSensitive))
	config := tsoptions.NewParsedCommandLine(&core.CompilerOptions{Format: core.TSTrue}, []tspath.RootedFilePath{"/project/main.ts"}, nil, "/project", tspath.CaseSensitive)
	host := &formattingTestHost{CompilerHost: compiler.NewCompilerHost(fs, bundled.LibPath(), nil, nil, nil)}
	result := FormatInputFiles(t.Context(), host, config)
	assert.Equal(t, len(result.Diagnostics), 0)
	assert.Equal(t, len(result.ChangedFiles), 0)
	assert.Assert(t, len(result.SourceFiles) > 2)
	before := host.parses.Load()
	program := compiler.NewProgram(compiler.ProgramOptions{Config: config, Host: WithFormattingSourceFiles(host, result.SourceFiles)})
	assert.Equal(t, host.parses.Load(), before)
	for _, file := range result.SourceFiles {
		assert.Assert(t, program.GetSourceFile(file.FileName()) == file)
	}
}

func TestFormattingReuseRequiresMatchingParseOptions(t *testing.T) {
	t.Parallel()
	const text = "const value = 1;"
	options := ast.SourceFileParseOptions{FileName: "/project/input.ts", PathKey: "/project/input.ts"}
	file := parser.ParseSourceFile(options, text, core.ScriptKindTS)
	fs := vfstest.FromMap(map[string]any{"/project/input.ts": text}, tspath.CaseSensitive)
	inner := &formattingTestHost{CompilerHost: compiler.NewCompilerHost(fs, "/lib", nil, nil, nil)}
	host := WithFormattingSourceFiles(inner, []*ast.SourceFile{file})
	forced := options
	forced.ExternalModuleIndicatorOptions.Force = true
	other := host.GetSourceFile(forced)
	assert.Assert(t, other != file)
	assert.Assert(t, other.ExternalModuleIndicator != nil)
	assert.Equal(t, other.ParseOptions(), forced)
	assert.Assert(t, file.ExternalModuleIndicator == nil)
	assert.Equal(t, file.ParseOptions(), options)
	assert.Equal(t, inner.parses.Load(), int32(1))
	assert.Assert(t, host.GetSourceFile(options) == file)
}

func TestFormattingCompositeTopLevelAwait(t *testing.T) {
	t.Parallel()
	for _, test := range []struct {
		name        string
		module      core.ModuleKind
		detection   core.ModuleDetectionKind
		packageJSON string
	}{
		{"forced module", core.ModuleKindESNext, core.ModuleDetectionKindForce, "{}"},
		{"inferred ESM", core.ModuleKindNodeNext, core.ModuleDetectionKindAuto, `{"type":"module"}`},
	} {
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()
			const text = "await\n    Promise.resolve(1);\n"
			fs := bundled.WrapFS(vfstest.FromMap(map[string]any{
				"/project/input.ts":     text,
				"/project/package.json": test.packageJSON,
			}, tspath.CaseSensitive))
			config := tsoptions.NewParsedCommandLine(&core.CompilerOptions{
				Format:          core.TSTrue,
				Composite:       core.TSTrue,
				Module:          test.module,
				ModuleDetection: test.detection,
				Target:          core.ScriptTargetES2022,
				NoEmitOnError:   core.TSTrue,
			}, []tspath.RootedFilePath{"/project/input.ts"}, nil, "/project", tspath.CaseSensitive)
			host := compiler.NewCompilerHost(fs, bundled.LibPath(), nil, nil, nil)
			formatted := FormatInputFiles(t.Context(), host, config)
			assert.Equal(t, len(formatted.Diagnostics), 0)
			assert.Equal(t, len(formatted.SourceFiles), 1)
			program := compiler.NewProgram(compiler.ProgramOptions{Config: config, Host: WithFormattingSourceFiles(host, formatted.SourceFiles)})
			assert.Equal(t, len(program.GetSyntacticDiagnostics(t.Context(), nil)), 0)
			assert.Equal(t, len(program.GetSemanticDiagnostics(t.Context(), nil)), 0)
			assert.Assert(t, program.GetSourceFile("/project/input.ts") == formatted.SourceFiles[0])
			assert.Assert(t, !program.Emit(t.Context(), compiler.EmitOptions{}).EmitSkipped)
			assert.Assert(t, fs.FileExists("/project/input.js"))
		})
	}
}

type formattingTestHost struct {
	compiler.CompilerHost
	parses atomic.Int32
}

func (host *formattingTestHost) GetSourceFile(options ast.SourceFileParseOptions) *ast.SourceFile {
	host.parses.Add(1)
	return host.CompilerHost.GetSourceFile(options)
}

func TestFormattingCompositeFastPath(t *testing.T) {
	t.Parallel()
	fs := vfstest.FromMap(map[string]any{
		"/project/main.ts":   "import { value } from './helper';\nexport const result=value;\n",
		"/project/helper.ts": "export const value=1;\n",
	}, tspath.CaseSensitive)
	config := tsoptions.NewParsedCommandLine(&core.CompilerOptions{
		FormatOnly: core.TSTrue,
		Composite:  core.TSTrue,
		NoLib:      core.TSTrue,
	}, []tspath.RootedFilePath{"/project/main.ts"}, nil, "/project", tspath.CaseSensitive)
	host := &formattingTestHost{CompilerHost: compiler.NewCompilerHost(fs, "/lib", nil, nil, nil)}
	result := FormatInputFiles(t.Context(), host, config)
	assert.Equal(t, len(result.Diagnostics), 0)
	assert.Equal(t, host.parses.Load(), int32(0))
	assert.DeepEqual(t, result.InputFiles, []tspath.RootedFilePath{"/project/main.ts"})
	text, ok := fs.ReadFile("/project/helper.ts")
	assert.Assert(t, ok)
	assert.Equal(t, text, "export const value=1;\n")
}

func TestFormattingSkipsDependencyInputs(t *testing.T) {
	t.Parallel()
	const dependency = "export interface Value{value:number;}\n"
	fs := vfstest.FromMap(map[string]any{
		"/project/main.ts": `import { value } from "./helper";
import type { Value } from "dep";
import type { Linked } from "linked";
import "./node_modules/relative";
export const result:Value={value};
`,
		"/project/helper.ts":                     "export const value=1;\n",
		"/project/node_modules/dep/package.json": `{"name":"dep","version":"1.0.0","types":"index.d.ts"}`,
		"/project/node_modules/dep/index.d.ts":   dependency,
		"/project/node_modules/relative.ts":      "export const untouched=1;\n",
		"/project/node_modules/root.d.ts":        dependency,
		"/project/node_modules/linked":           vfstest.Symlink("/packages/linked"),
		"/packages/linked/package.json":          `{"name":"linked","version":"1.0.0","types":"index.d.ts"}`,
		"/packages/linked/index.d.ts":            "export interface Linked{value:number;}\n",
	}, tspath.CaseSensitive)
	config := tsoptions.NewParsedCommandLine(&core.CompilerOptions{
		FormatOnly: core.TSTrue,
		NoLib:      core.TSTrue,
	}, []tspath.RootedFilePath{"/project/main.ts", "/project/node_modules/root.d.ts"}, nil, "/project", tspath.CaseSensitive)
	host := compiler.NewCompilerHost(fs, "/lib", nil, nil, nil)
	program := compiler.NewProgram(compiler.ProgramOptions{Config: config, Host: host})
	assert.Assert(t, program.GetSourceFile("/project/node_modules/dep/index.d.ts") != nil)
	assert.Assert(t, program.GetSourceFile("/packages/linked/index.d.ts") != nil)
	assert.Assert(t, program.GetSourceFile("/project/node_modules/relative.ts") != nil)
	result := FormatInputFiles(t.Context(), host, config)
	assert.Equal(t, len(result.Diagnostics), 0)
	assert.DeepEqual(t, result.InputFiles, []tspath.RootedFilePath{"/project/main.ts", "/project/helper.ts"})
	for name, expected := range map[tspath.RootedFilePath]string{
		"/project/node_modules/dep/index.d.ts": dependency,
		"/project/node_modules/root.d.ts":      dependency,
		"/project/node_modules/relative.ts":    "export const untouched=1;\n",
		"/packages/linked/index.d.ts":          "export interface Linked{value:number;}\n",
	} {
		actual, ok := fs.ReadFile(name)
		assert.Assert(t, ok)
		assert.Equal(t, actual, expected)
	}
}

type formattingBarrierFS struct {
	vfs.FS
	entered chan struct{}
	release chan struct{}
}

func (fs *formattingBarrierFS) ReadFile(name tspath.RootedFilePath) (string, bool) {
	if name == "/project/first.ts" || name == "/project/second.ts" {
		fs.entered <- struct{}{}
		<-fs.release
	}
	return fs.FS.ReadFile(name)
}

func TestFormattingWorkGroupParallelism(t *testing.T) {
	t.Parallel()
	fs := &formattingBarrierFS{
		FS: vfstest.FromMap(map[string]any{
			"/project/first.ts":  "export const first=1;\n",
			"/project/second.ts": "export const second=2;\n",
		}, tspath.CaseSensitive),
		entered: make(chan struct{}, 2),
		release: make(chan struct{}),
	}
	files := []tspath.RootedFilePath{"/project/first.ts", "/project/second.ts"}
	config := tsoptions.NewParsedCommandLine(&core.CompilerOptions{FormatOnly: core.TSTrue, Composite: core.TSTrue}, files, nil, "/project", tspath.CaseSensitive)
	host := compiler.NewCompilerHost(fs, "/lib", nil, nil, nil)
	done := make(chan FormatResult, 1)
	go func() { done <- FormatInputFiles(t.Context(), host, config) }()
	timer := time.NewTimer(5 * time.Second)
	defer timer.Stop()
	for range files {
		select {
		case <-fs.entered:
			continue
		case <-timer.C:
			close(fs.release)
			<-done
			t.Fatal("formatting input reads did not run concurrently")
		}
	}
	close(fs.release)
	result := <-done
	assert.Equal(t, len(result.Diagnostics), 0)
	assert.DeepEqual(t, result.ChangedFiles, files)
	for i, expected := range []string{"export const first = 1;\n", "export const second = 2;\n"} {
		text, ok := fs.ReadFile(files[i])
		assert.Assert(t, ok)
		assert.Equal(t, text, expected)
	}
}

func TestFormattingSkipsDefaultLibraries(t *testing.T) {
	t.Parallel()
	fs := bundled.WrapFS(vfstest.FromMap(map[string]any{
		"/project/main.ts": "export const value=1;\n",
	}, tspath.CaseSensitive))
	config := tsoptions.NewParsedCommandLine(&core.CompilerOptions{FormatOnly: core.TSTrue}, []tspath.RootedFilePath{"/project/main.ts"}, nil, "/project", tspath.CaseSensitive)
	host := compiler.NewCompilerHost(fs, bundled.LibPath(), nil, nil, nil)
	program := compiler.NewProgram(compiler.ProgramOptions{Config: config, Host: host})
	assert.Assert(t, core.Some(program.GetSourceFiles(), func(file *ast.SourceFile) bool {
		return program.IsSourceFileDefaultLibrary(file.PathKey())
	}))
	result := FormatInputFiles(t.Context(), host, config)
	assert.Equal(t, len(result.Diagnostics), 0)
	assert.DeepEqual(t, result.InputFiles, []tspath.RootedFilePath{"/project/main.ts"})
}

func TestFormattingDiagnosticOrder(t *testing.T) {
	t.Parallel()
	files := []tspath.RootedFilePath{"/project/first.ts", "/project/second.ts"}
	for _, singleThreaded := range []bool{false, true} {
		t.Run(strconv.FormatBool(singleThreaded), func(t *testing.T) {
			t.Parallel()
			fs := vfstest.FromMap(map[string]any{
				"/project/first.ts":  "const first=1;\n",
				"/project/second.ts": "const second=2;\n",
			}, tspath.CaseSensitive)
			config := tsoptions.NewParsedCommandLine(&core.CompilerOptions{
				FormatOnly:        core.TSTrue,
				FormatDiagnostics: core.TSTrue,
				Composite:         core.TSTrue,
				SingleThreaded:    core.BoolToTristate(singleThreaded),
			}, files, nil, "/project", tspath.CaseSensitive)
			host := compiler.NewCompilerHost(fs, "/lib", nil, nil, nil)
			for range 3 {
				result := FormatInputFiles(t.Context(), host, config)
				assert.Equal(t, len(result.Diagnostics), 4)
				assert.Equal(t, len(result.ChangedFiles), 0)
				for i, diagnostic := range result.Diagnostics {
					assert.Equal(t, diagnostic.File().FileName(), files[i/2])
				}
			}
		})
	}
}

func TestFormattingLineRanges(t *testing.T) {
	t.Parallel()
	for _, test := range []struct {
		name   string
		text   string
		ranges []tsoptions.FormattingLineRange
		want   string
		errors int
	}{
		{
			"middle line", "function f(){\nconst value=1;\nreturn value+1;\n}",
			[]tsoptions.FormattingLineRange{{Start: 2, End: 2}},
			"function f(){\n    const value = 1;\nreturn value+1;\n}", 0,
		},
		{
			"unicode and CRLF", "function f(){\r\nconst \u03bb=1;\r\nreturn \u03bb+1;\r\n}",
			[]tsoptions.FormattingLineRange{{Start: 2, End: 2}},
			"function f(){\r\n    const \u03bb = 1;\r\nreturn \u03bb+1;\r\n}", 0,
		},
		{"end of file", "const value=1;", []tsoptions.FormattingLineRange{{Start: 1, End: 1}}, "const value = 1;", 0},
		{"outside file", "const value=1;", []tsoptions.FormattingLineRange{{Start: 2, End: 2}}, "const value=1;", 1},
	} {
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()
			file := parser.ParseSourceFile(ast.SourceFileParseOptions{FileName: "/input.ts", PathKey: "/input.ts"}, test.text, core.ScriptKindTS)
			ctx := format.WithFormatCodeSettings(context.Background(), lsutil.GetDefaultFormatCodeSettings(), "\n")
			edits, _, errors := formattingEdits(ctx, file, test.ranges, false)
			assert.Equal(t, len(errors), test.errors)
			assert.Equal(t, core.ApplyBulkEdits(test.text, edits), test.want)
		})
	}
}
