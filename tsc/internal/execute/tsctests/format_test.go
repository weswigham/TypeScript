package tsctests

import (
	"fmt"
	"slices"
	"strconv"
	"strings"
	"testing"

	"github.com/microsoft/TypeScript/tsc/internal/execute"
	"github.com/microsoft/TypeScript/tsc/internal/execute/tsc"
	"github.com/microsoft/TypeScript/tsc/internal/fswatch"
	"gotest.tools/v3/assert"
)

func TestFormattingExpectedDifferences(t *testing.T) {
	t.Parallel()
	for _, test := range []struct {
		name        string
		explanation string
		allowed     []string
		files       []string
		want        bool
	}{
		{"explained source map", "Formatting changes source positions.", []string{"input.js.map"}, []string{"input.js.map"}, true},
		{"unexplained source map", "", []string{"input.js.map"}, []string{"input.js.map"}, false},
		{"unexpected JavaScript", "Formatting changes source positions.", []string{"input.js.map"}, []string{"input.js.map", "input.js"}, false},
		{"no permitted files", "No changes are permitted.", []string{}, []string{"input.js.map"}, false},
		{"legacy explanation", "Existing suites allow an explained difference.", nil, []string{"input.js"}, true},
	} {
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()
			edit := &tscEdit{expectedDiff: test.explanation, expectedDiffFiles: test.allowed}
			differences := make([]incrementalDiff, len(test.files))
			for index, name := range test.files {
				differences[index] = incrementalDiff{fileName: name}
			}
			assert.Equal(t, edit.acceptsDiff(differences), test.want)
		})
	}
}

func TestFormattingBuildInfoInputCollision(t *testing.T) {
	t.Parallel()
	const source = "import type {Value} from 'dep';\nexport const value:Value=1;\n"
	const dependency = "export type Value=number;\n"
	for _, build := range []bool{false, true} {
		for _, buildInfo := range []string{"input.ts", "node_modules/dep/index.d.ts"} {
			for _, mode := range formattingModes {
				t.Run(fmt.Sprintf("build=%v/%s/%s", build, buildInfo, mode.name), func(t *testing.T) {
					t.Parallel()
					sys := newTestSys(&tscInput{
						cwd: "/app",
						files: FileMap{
							"/app/tsconfig.json":                 fmt.Sprintf(`{"compilerOptions":{"incremental":true,"composite":%v,"tsBuildInfoFile":"%s"},"files":["input.ts"]}`, build, buildInfo),
							"/app/input.ts":                      source,
							"/app/node_modules/dep/package.json": `{"types":"index.d.ts"}`,
							"/app/node_modules/dep/index.d.ts":   dependency,
						},
					}, false)
					command := []string{"-p", "."}
					if build {
						command = []string{"-b", "."}
					}
					result := execute.CommandLine(t.Context(), sys, slices.Concat(command, mode.args), sys)
					assert.Assert(t, result.Status != tsc.ExitStatusSuccess)
					assert.Equal(t, sys.readFileNoError("/app/input.ts"), source)
					assert.Equal(t, sys.readFileNoError("/app/node_modules/dep/index.d.ts"), dependency)
				})
			}
		}
	}
}

func TestFormattingCacheParsingContext(t *testing.T) {
	t.Parallel()
	const source = "await\n1;\n"
	const formatted = "await\n    1;\n"
	for _, build := range []bool{false, true} {
		for _, packageType := range []bool{false, true} {
			for _, mode := range formattingModes {
				t.Run(fmt.Sprintf("build=%v/packageType=%v/%s", build, packageType, mode.name), func(t *testing.T) {
					t.Parallel()
					configuration := func(detection string) string {
						return fmt.Sprintf(`{"compilerOptions":{"incremental":true,"composite":%v,"module":"nodenext","target":"es2022","moduleDetection":"%s"},"files":["input.ts"]}`, build, detection)
					}
					detection := "legacy"
					if packageType {
						detection = "auto"
					}
					sys := newTestSys(&tscInput{
						cwd: "/app",
						files: FileMap{
							"/app/tsconfig.json": configuration(detection),
							"/app/package.json":  `{"type":"commonjs"}`,
							"/app/input.ts":      source,
						},
					}, false)
					command := []string{"-p", "."}
					if build {
						command = []string{"-b", "."}
					}
					result := execute.CommandLine(t.Context(), sys, slices.Concat(command, []string{"--formatOnly"}), sys)
					assert.Equal(t, result.Status, tsc.ExitStatusSuccess)
					assert.Equal(t, sys.readFileNoError("/app/input.ts"), source)
					if packageType {
						sys.writeFileNoError("/app/package.json", `{"type":"module"}`)
					} else {
						sys.writeFileNoError("/app/tsconfig.json", configuration("force"))
					}
					for range 2 {
						sys.clearOutput()
						result = execute.CommandLine(t.Context(), sys, slices.Concat(command, mode.args), sys)
						if slices.Contains(mode.args, "--formatDiagnostics") {
							assert.Assert(t, result.Status != tsc.ExitStatusSuccess)
							assert.Assert(t, strings.Contains(sys.getOutput(false), "Expected indentation of 4 columns."))
							assert.Equal(t, sys.readFileNoError("/app/input.ts"), source)
						} else {
							assert.Equal(t, sys.readFileNoError("/app/input.ts"), formatted)
						}
					}
				})
			}
		}
	}
}

func TestFormattingSelectedWatchInputs(t *testing.T) {
	t.Parallel()
	const source = "export function value() {\n    return 1;\n}\n"
	const other = "export function untouched(){\nreturn 2;\n}\n"
	for _, project := range []bool{false, true} {
		for _, wildcard := range []bool{false, true} {
			for _, diagnostics := range []bool{false, true} {
				t.Run(fmt.Sprintf("project=%v/wildcard=%v/diagnostics=%v", project, wildcard, diagnostics), func(t *testing.T) {
					t.Parallel()
					roots := `"files":["input.ts","other.ts"]`
					if wildcard {
						roots = `"include":["*.ts"]`
					}
					sys := newTestSys(&tscInput{
						cwd: "/app",
						files: FileMap{
							"/app/tsconfig.json": `{"extends":"./base.json",` + roots + `}`,
							"/app/base.json":     `{"formattingOptions":{"indentSize":4}}`,
							"/app/input.ts":      source,
							"/app/other.ts":      other,
						},
					}, false)
					args := []string{"--formatOnly", "--watch", "input.ts"}
					if project {
						args = append(args, "-p", ".")
					}
					if diagnostics {
						args = append(args, "--formatDiagnostics")
					}
					result := execute.CommandLine(t.Context(), sys, args, sys)
					assert.Assert(t, result.Watcher != nil)
					assert.Equal(t, sys.readFileNoError("/app/other.ts"), other)
					sys.clearOutput()
					sys.writeFileNoError("/app/base.json", `{"formattingOptions":{"indentSize":2}}`)
					sys.mockWatchBackend.SendEvents([]fswatch.Event{{Kind: fswatch.EventUpdate, Path: "/app/base.json"}})
					result.Watcher.DoCycle()
					assert.Equal(t, sys.readFileNoError("/app/other.ts"), other)
					assert.Assert(t, !strings.Contains(sys.getOutput(false), "other.ts"))
					if diagnostics {
						assert.Equal(t, sys.readFileNoError("/app/input.ts"), source)
						assert.Assert(t, strings.Contains(sys.getOutput(false), "Expected indentation of 2 columns."))
					} else {
						assert.Equal(t, sys.readFileNoError("/app/input.ts"), "export function value() {\n  return 1;\n}\n")
					}
					sys.clearOutput()
					sys.writeFileNoError("/app/added.ts", other)
					sys.mockWatchBackend.SendEvents([]fswatch.Event{{Kind: fswatch.EventUpdate, Path: "/app/added.ts"}})
					result.Watcher.DoCycle()
					assert.Equal(t, sys.readFileNoError("/app/added.ts"), other)
					assert.Assert(t, !strings.Contains(sys.getOutput(false), "added.ts"))
				})
			}
		}
	}
}

var formattingModes = []struct {
	name string
	args []string
}{
	{"format", []string{"--format"}},
	{"format only", []string{"--formatOnly"}},
	{"check and compile", []string{"--format", "--formatDiagnostics"}},
	{"check only", []string{"--formatOnly", "--formatDiagnostics"}},
}

func TestTscFormattingIncrementalState(t *testing.T) {
	t.Parallel()
	const directory = "/home/src/workspaces/project/"
	for _, build := range []bool{false, true} {
		command := []string{"-p", "."}
		if build {
			command = []string{"-b", "."}
		}
		for _, mode := range formattingModes {
			args := slices.Concat(command, mode.args)
			compilationDiff := ""
			if !slices.Contains(mode.args, "--formatDiagnostics") {
				compilationDiff = "Source maps refer to the input formatted by earlier runs; the fresh build compiles the original unformatted input."
			}
			(&tscInput{
				subScenario:     "incremental state with " + mode.name,
				commandLineArgs: args,
				files: FileMap{
					directory + "tsconfig.json": fmt.Sprintf(`{"extends":"./base.json","compilerOptions":{"incremental":true,"composite":%v,"declaration":true,"sourceMap":true,"declarationMap":true},"files":["input.ts"]}`, build),
					directory + "base.json":     `{"formattingOptions":{"indentSize":2}}`,
					directory + "input.ts":      "export function value() {\n  return 1;\n}\n",
				},
				edits: []*tscEdit{
					noChange,
					{caption: "invalidate cached formatting through inherited settings", edit: func(sys *TestSys) {
						sys.writeFileNoError(directory+"base.json", `{"formattingOptions":{"indentSize":4}}`)
					}},
					noChange,
					{caption: "recover from malformed build info", edit: func(sys *TestSys) {
						sys.writeFileNoError(directory+"tsconfig.tsbuildinfo", "{invalid")
					}},
					{caption: "recover from build info from another compiler version", edit: func(sys *TestSys) {
						sys.writeFileNoError(directory+"tsconfig.tsbuildinfo", `{"version":"OldVersion","formatting":{"options":"old","files":{}}}`)
					}},
					{caption: "invalidate cached formatting through source changes", edit: func(sys *TestSys) {
						sys.writeFileNoError(directory+"input.ts", "export function value(){\nreturn 2;\n}\n")
					}},
					noChange,
					{caption: "check without emitting after formatting", commandLineArgs: slices.Concat(command, []string{"--noEmit"})},
					{caption: "compile without formatting", commandLineArgs: command, expectedDiff: compilationDiff, expectedDiffFiles: []string{directory + "input.js.map"}},
					{caption: "compile changed source without formatting", commandLineArgs: command, edit: func(sys *TestSys) {
						sys.writeFileNoError(directory+"input.ts", "export function value(){\nreturn 3;\n}\n")
					}},
					{caption: "resume formatting after ordinary compilation"},
					noChange,
				},
			}).run(t, "formatting")
		}
	}
}

func TestBuildFormattingControls(t *testing.T) {
	t.Parallel()
	const directory = "/home/src/workspaces/project/"
	for _, mode := range formattingModes {
		args := slices.Concat([]string{"-b", "."}, mode.args)
		(&tscInput{
			subScenario:     "non incremental build controls with " + mode.name,
			commandLineArgs: slices.Concat(args, []string{"--dry"}),
			files: FileMap{
				directory + "tsconfig.json": `{"compilerOptions":{"declaration":true},"files":["input.ts"]}`,
				directory + "input.ts":      "export const value=1;\n",
			},
			edits: []*tscEdit{
				{caption: "format after dry build", commandLineArgs: args},
				{caption: "repeat formatting", commandLineArgs: args},
				{caption: "force build without discarding formatting state", commandLineArgs: slices.Concat(args, []string{"--force"})},
				{caption: "reject formatting flags with clean", commandLineArgs: slices.Concat(args, []string{"--clean"}), edit: func(sys *TestSys) {
					sys.writeFileNoError(directory+"input.ts", "export const value=2;\n")
				}},
				{caption: "clean outputs and formatting state", commandLineArgs: []string{"-b", ".", "--clean"}},
				{caption: "rebuild after clean", commandLineArgs: args},
				{caption: "compile after formatting", commandLineArgs: []string{"-b", "."}},
			},
		}).run(t, "formatting")
	}
}

func TestBuildFormattingProjectReferences(t *testing.T) {
	t.Parallel()
	const directory = "/home/src/workspaces/project/"
	for _, mode := range formattingModes {
		(&tscInput{
			subScenario:     "project reference error recovery with " + mode.name,
			commandLineArgs: slices.Concat([]string{"-b", ".", "--stopBuildOnErrors"}, mode.args),
			files: FileMap{
				directory + "tsconfig.json":     `{"files":[],"references":[{"path":"./app"}]}`,
				directory + "lib/tsconfig.json": `{"compilerOptions":{"composite":true,"noEmitOnError":true},"files":["index.ts"]}`,
				directory + "lib/index.ts":      "export const value:string=1;\n",
				directory + "app/tsconfig.json": `{"compilerOptions":{"composite":true,"noEmitOnError":true},"references":[{"path":"../lib"}],"files":["index.ts"]}`,
				directory + "app/index.ts":      "import {value} from '../lib';\nexport const result=value;\n",
			},
			edits: []*tscEdit{
				noChange,
				{caption: "fix upstream semantic error", edit: func(sys *TestSys) {
					sys.writeFileNoError(directory+"lib/index.ts", "export const value:string='fixed';\n")
				}},
				noChange,
				{caption: "propagate changed upstream declaration", edit: func(sys *TestSys) {
					sys.writeFileNoError(directory+"lib/index.ts", "export const value:number=2;\n")
				}},
				{caption: "compile graph after formatting", commandLineArgs: []string{"-b", ".", "--stopBuildOnErrors"}},
			},
		}).run(t, "formatting")
	}
}

func TestBuildFormattingWatch(t *testing.T) {
	t.Parallel()
	const directory = "/home/src/workspaces/project/"
	for _, mode := range formattingModes {
		noChangeDiff := ""
		if slices.Contains(mode.args, "--formatDiagnostics") {
			noChangeDiff = "Watch mode does not report diagnostics again when no filesystem events were delivered."
		}
		(&tscInput{
			subScenario:     "watch state with " + mode.name,
			commandLineArgs: slices.Concat([]string{"-b", ".", "--watch"}, mode.args),
			files: FileMap{
				directory + "tsconfig.json": `{"extends":"./base.json","compilerOptions":{"composite":true,"noEmitOnError":true,"outDir":"dist"},"include":["src"]}`,
				directory + "base.json":     `{"formattingOptions":{"indentSize":2}}`,
				directory + "src/input.ts":  "export function value() {\n  return 1;\n}\n",
			},
			edits: []*tscEdit{
				noChange,
				{caption: "change inherited formatting settings", edit: func(sys *TestSys) {
					sys.writeFileNoError(directory+"base.json", `{"formattingOptions":{"indentSize":4}}`)
				}},
				{caption: "change source text", edit: func(sys *TestSys) {
					sys.writeFileNoError(directory+"src/input.ts", "export function value(){\nreturn 2;\n}\n")
				}},
				{caption: "add an unformatted input", edit: func(sys *TestSys) {
					sys.writeFileNoError(directory+"src/added.ts", "export const added=1;\n")
				}},
				{caption: "remove an input", edit: func(sys *TestSys) {
					assert.NilError(t, sys.fsFromFileMap().Remove(directory+"src/added.ts"))
				}},
				{caption: "introduce a semantic error", edit: func(sys *TestSys) {
					sys.writeFileNoError(directory+"src/input.ts", "export const value:string=1;\n")
				}},
				{caption: "fix the semantic error", edit: func(sys *TestSys) {
					sys.writeFileNoError(directory+"src/input.ts", "export const value=3;\n")
				}},
				{caption: "no change", expectedDiff: noChangeDiff, expectedDiffFiles: []string{"output.txt"}},
			},
		}).run(t, "formatting")
	}
}

func TestBuildFormatWatchImportedInputs(t *testing.T) {
	t.Parallel()
	for _, incremental := range []bool{false, true} {
		t.Run(strconv.FormatBool(incremental), func(t *testing.T) {
			t.Parallel()
			sys := newTestSys(&tscInput{
				cwd: "/app",
				files: FileMap{
					"/app/tsconfig.json": fmt.Sprintf(`{"compilerOptions":{"incremental":%v},"files":["main.ts"]}`, incremental),
					"/app/main.ts":       "import {value} from '../shared/helper';\nexport const result=value;\n",
					"/shared/helper.ts":  "export const value=1;\n",
					"/other/more.ts":     "export const more=3;\n",
				},
			}, false)
			result := execute.CommandLine(t.Context(), sys, []string{"-b", "--formatOnly", "--watch"}, sys)
			assert.Assert(t, result.Watcher != nil)
			assert.Equal(t, sys.readFileNoError("/shared/helper.ts"), "export const value = 1;\n")
			assert.Assert(t, isWatched(sys, "/shared"))
			assert.Assert(t, !isWatched(sys, "/other"))

			sys.writeFileNoError("/shared/helper.ts", "export const value=2;\n")
			sys.mockWatchBackend.SendEvents([]fswatch.Event{{Kind: fswatch.EventUpdate, Path: "/shared/helper.ts"}})
			result.Watcher.DoCycle()
			assert.Equal(t, sys.readFileNoError("/shared/helper.ts"), "export const value = 2;\n")

			sys.writeFileNoError("/shared/helper.ts", "import {more} from '../other/more';\nexport const value=more;\n")
			sys.mockWatchBackend.SendEvents([]fswatch.Event{{Kind: fswatch.EventUpdate, Path: "/shared/helper.ts"}})
			result.Watcher.DoCycle()
			assert.Assert(t, isWatched(sys, "/other"))
			assert.Equal(t, sys.readFileNoError("/other/more.ts"), "export const more = 3;\n")

			sys.writeFileNoError("/other/more.ts", "export const more=4;\n")
			sys.mockWatchBackend.SendEvents([]fswatch.Event{{Kind: fswatch.EventUpdate, Path: "/other/more.ts"}})
			result.Watcher.DoCycle()
			assert.Equal(t, sys.readFileNoError("/other/more.ts"), "export const more = 4;\n")

			sys.writeFileNoError("/shared/helper.ts", "export const value=5;\n")
			sys.mockWatchBackend.SendEvents([]fswatch.Event{{Kind: fswatch.EventUpdate, Path: "/shared/helper.ts"}})
			result.Watcher.DoCycle()
			assert.Assert(t, !isWatched(sys, "/other"))
			assert.Assert(t, !sys.FS().FileExists("/app/main.js"))
		})
	}
}

func TestTscFormatting(t *testing.T) {
	t.Parallel()
	const file = "/home/src/workspaces/project/input.ts"
	for _, test := range []*tscInput{
		{
			subScenario:     "format and emit use the same source",
			commandLineArgs: []string{"--format", "--sourceMap", "input.ts"},
			files:           FileMap{file: "export function value(input:number){\nreturn input+1;\n}\n"},
			edits:           noChangeOnlyEdit,
		},
		{
			subScenario:     "format only ignores type errors and never emits",
			commandLineArgs: []string{"--formatOnly", "--declaration", "input.ts"},
			files:           FileMap{file: "const value:string=1;\n"},
			edits:           noChangeOnlyEdit,
		},
		{
			subScenario:     "format diagnostics do not write source files",
			commandLineArgs: []string{"--formatOnly", "--formatDiagnostics", "input.ts"},
			files:           FileMap{file: "const value=1;\n"},
			edits:           noChangeOnlyEdit,
		},
		{
			subScenario:     "formatting diagnostics do not block normal emit",
			commandLineArgs: []string{"--format", "--formatDiagnostics", "--noEmitOnError", "--declaration", "--sourceMap", "input.ts"},
			files:           FileMap{file: "export const value=1;\n"},
			edits:           noChangeOnlyEdit,
		},
		{
			subScenario:     "semantic errors still block emit during formatting checks",
			commandLineArgs: []string{"--format", "--formatDiagnostics", "--noEmitOnError", "--declaration", "input.ts"},
			files:           FileMap{file: "export const value:string=1;\n"},
			edits:           noChangeOnlyEdit,
		},
		{
			subScenario:     "formatting diagnostics do not block incremental emit",
			commandLineArgs: []string{"--format", "--formatDiagnostics", "-p", "."},
			files: FileMap{
				file: "export const value=1;\n",
				"/home/src/workspaces/project/tsconfig.json": `{"compilerOptions":{"incremental":true,"declaration":true,"noEmitOnError":true},"files":["input.ts"]}`,
			},
			edits: []*tscEdit{
				noChange,
				{caption: "emit changed source despite formatting diagnostics", edit: func(sys *TestSys) {
					sys.writeFileNoError(file, "export const value=2;\n")
				}},
			},
		},
		{
			subScenario:     "formatting diagnostics do not block watch emit",
			commandLineArgs: []string{"--format", "--formatDiagnostics", "--watch", "-p", "."},
			files: FileMap{
				file: "export const value=1;\n",
				"/home/src/workspaces/project/tsconfig.json": `{"compilerOptions":{"declaration":true,"noEmitOnError":true},"files":["input.ts"]}`,
			},
			edits: []*tscEdit{
				{caption: "emit changed source despite formatting diagnostics", edit: func(sys *TestSys) {
					sys.writeFileNoError(file, "export const value=2;\n")
				}},
			},
		},
		{
			subScenario:     "formatting diagnostics do not stop downstream project builds",
			commandLineArgs: []string{"-b", "--format", "--formatDiagnostics", "--stopBuildOnErrors", "."},
			files: FileMap{
				"/home/src/workspaces/project/tsconfig.json":     `{"files":[],"references":[{"path":"./app"}]}`,
				"/home/src/workspaces/project/lib/tsconfig.json": `{"compilerOptions":{"composite":true,"noEmitOnError":true},"files":["index.ts"]}`,
				"/home/src/workspaces/project/lib/index.ts":      "export const value=1;\n",
				"/home/src/workspaces/project/app/tsconfig.json": `{"compilerOptions":{"composite":true,"noEmitOnError":true},"references":[{"path":"../lib"}],"files":["index.ts"]}`,
				"/home/src/workspaces/project/app/index.ts":      "import {value} from '../lib';\nexport const result=value;\n",
			},
			edits: []*tscEdit{
				noChange,
				{caption: "build changed dependency and downstream project", edit: func(sys *TestSys) {
					sys.writeFileNoError("/home/src/workspaces/project/lib/index.ts", "export const value=2;\n")
				}},
			},
		},
		{
			subScenario:     "line ranges preserve unselected lines",
			commandLineArgs: []string{"--formatOnly", "input.ts:2-2,4-4", "other.ts"},
			files: FileMap{
				file:                                    "function value(){\nconst first=1;\nconst untouched=2;\nreturn first+untouched;\n}\n",
				"/home/src/workspaces/project/other.ts": "const other=1;\n",
			},
			edits: noChangeOnlyEdit,
		},
		{
			subScenario:     "explicit files inherit discovered config formatting",
			commandLineArgs: []string{"--formatOnly", "input.ts"},
			files: FileMap{
				file: "function value(){\nreturn 1;\n}\n",
				"/home/src/workspaces/project/tsconfig.json": `{"formattingOptions":{"indentSize":2},"files":["input.ts"]}`,
			},
		},
		{
			subScenario:     "show config preserves inherited formatting options",
			commandLineArgs: []string{"--showConfig", "-p", "."},
			files: FileMap{
				file: "const value=1;\n",
				"/home/src/workspaces/project/tsconfig.json": `{"formattingOptions":{"indentStyle":"SMART","semicolons":"insert","indentSize":2},"files":["input.ts"]}`,
			},
		},
		{
			subScenario:     "scoped files use an explicitly selected project",
			commandLineArgs: []string{"--formatOnly", "-p", ".", "input.ts:2-2"},
			files: FileMap{
				file:                                    "function value(){\nreturn 1;\n}\n",
				"/home/src/workspaces/project/other.ts": "const untouched=1;\n",
				"/home/src/workspaces/project/tsconfig.json": `{"formattingOptions":{"indentSize":2},"files":["input.ts","other.ts"]}`,
			},
		},
		{
			subScenario:     "scoped diagnostics only validate selected lines",
			commandLineArgs: []string{"--formatOnly", "--formatDiagnostics", "input.ts:2-2"},
			files:           FileMap{file: "function value(){\nreturn 1+2;\n}\n"},
			edits:           noChangeOnlyEdit,
		},
		{
			subScenario:     "partial formatting never caches a whole file",
			commandLineArgs: []string{"--formatOnly", "--incremental", "--tsBuildInfoFile", "cache.tsbuildinfo", "input.ts:2-2"},
			files:           FileMap{file: "function value(){\nconst first=1;\nreturn first+1;\n}\n"},
			edits: []*tscEdit{
				{caption: "format the rest of the file", commandLineArgs: []string{"--formatOnly", "--incremental", "--tsBuildInfoFile", "cache.tsbuildinfo", "input.ts"}},
			},
		},
		{
			subScenario:     "failed incremental formatting validation is not cached",
			commandLineArgs: []string{"--formatOnly", "--formatDiagnostics", "-p", "."},
			files: FileMap{
				file: "function value() {\n    return 1;\n}\n",
				"/home/src/workspaces/project/tsconfig.json": `{"compilerOptions":{"incremental":true},"files":["input.ts"],"formattingOptions":{"indentSize":2}}`,
			},
			edits: []*tscEdit{
				noChange,
				{caption: "apply previously reported changes", commandLineArgs: []string{"--formatOnly", "-p", "."}},
			},
		},
		{
			subScenario:     "incremental format state is independent of compilation",
			commandLineArgs: []string{"--formatOnly", "-p", "."},
			files: FileMap{
				file: "export const value=1;\n",
				"/home/src/workspaces/project/tsconfig.json": `{"compilerOptions":{"incremental":true,"declaration":true},"files":["input.ts"]}`,
			},
			edits: []*tscEdit{
				{caption: "unchanged formatting does no work"},
				{caption: "first compilation after format only", commandLineArgs: []string{"-p", "."}},
				{caption: "format changed source without rebuilding", commandLineArgs: []string{"--formatOnly", "-p", "."}, edit: func(sys *TestSys) {
					sys.writeFileNoError(file, "export const value=2;\n")
				}},
				{caption: "compile after separately formatting changed source", commandLineArgs: []string{"-p", "."}},
				{caption: "compile changed source without formatting", commandLineArgs: []string{"-p", "."}, edit: func(sys *TestSys) {
					sys.writeFileNoError(file, "export const value=3;\n")
				}},
				{caption: "format source updated by an ordinary build", commandLineArgs: []string{"--formatOnly", "-p", "."}},
			},
		},
		{
			subScenario:     "formatting settings invalidate incremental formatting",
			commandLineArgs: []string{"--formatOnly", "-p", "."},
			files: FileMap{
				file: "export function value(){\nreturn 1;\n}\n",
				"/home/src/workspaces/project/tsconfig.json": `{"compilerOptions":{"incremental":true},"files":["input.ts"],"formattingOptions":{"indentSize":2}}`,
			},
			edits: []*tscEdit{
				{caption: "change formatting options", edit: func(sys *TestSys) {
					sys.writeFileNoError("/home/src/workspaces/project/tsconfig.json", `{"compilerOptions":{"incremental":true},"files":["input.ts"],"formattingOptions":{"indentSize":8}}`)
				}},
				noChange,
			},
		},
		{
			subScenario:     "build mode formatting checks survive up to date builds",
			commandLineArgs: []string{"-b", "."},
			files: FileMap{
				file: "export const value=1;\n",
				"/home/src/workspaces/project/tsconfig.json": `{"compilerOptions":{"composite":true},"files":["input.ts"]}`,
			},
			edits: []*tscEdit{
				{caption: "check formatting without writing source", commandLineArgs: []string{"-b", "--format", "--formatDiagnostics", "."}},
				{caption: "repeat failed formatting check", commandLineArgs: []string{"-b", "--format", "--formatDiagnostics", "."}},
				{caption: "check formatting without compiling", commandLineArgs: []string{"-b", "--formatOnly", "--formatDiagnostics", "."}},
				{caption: "apply formatting without compiling", commandLineArgs: []string{"-b", "--formatOnly", "."}},
				{caption: "compile after formatting an up to date project", commandLineArgs: []string{"-b", "."}},
				{caption: "check clean formatting", commandLineArgs: []string{"-b", "--format", "--formatDiagnostics", "."}, expectedDiff: "The incremental input was formatted by the earlier format-only build; the fresh build starts with the original unformatted input.", expectedDiffFiles: []string{"output.txt"}},
				{caption: "repeat clean formatting check", commandLineArgs: []string{"-b", "--formatOnly", "--formatDiagnostics", "."}, expectedDiff: "The incremental input was formatted by the earlier format-only build; the fresh build starts with the original unformatted input.", expectedDiffFiles: []string{"output.txt"}},
			},
		},
		{
			subScenario:     "build mode supports leading format flags",
			commandLineArgs: []string{"--formatOnly", "-b", "."},
			files: FileMap{
				file: "export const value=1;\n",
				"/home/src/workspaces/project/tsconfig.json": `{"compilerOptions":{"composite":true},"files":["input.ts"]}`,
			},
			edits: []*tscEdit{
				{caption: "build after format only", commandLineArgs: []string{"-b", "."}},
				{caption: "format and build an up to date project", commandLineArgs: []string{"-b", "--format", "."}},
				{caption: "format changed source", commandLineArgs: []string{"-b", "--formatOnly", "."}, edit: func(sys *TestSys) {
					sys.writeFileNoError(file, "export const value=2;\n")
				}},
				{caption: "build changed source after format only", commandLineArgs: []string{"-b", "."}},
			},
		},
		{
			subScenario:     "format only watch tracks changed files",
			commandLineArgs: []string{"--formatOnly", "--watch", "-p", "."},
			files: FileMap{
				file: "export const value=1;\n",
				"/home/src/workspaces/project/tsconfig.json": `{"compilerOptions":{"incremental":true},"files":["input.ts"]}`,
			},
			edits: []*tscEdit{
				{caption: "format a changed file", edit: func(sys *TestSys) {
					sys.writeFileNoError(file, "export const value=2;\n")
				}},
				noChange,
			},
		},
		{
			subScenario:     "incremental formatting follows implicit import changes",
			commandLineArgs: []string{"--formatOnly", "-p", "."},
			files: FileMap{
				file: "import {value} from './hidden/helper';\nexport const result=value;\n",
				"/home/src/workspaces/project/hidden/helper.ts": "export const value=1;\n",
				"/home/src/workspaces/project/tsconfig.json":    `{"compilerOptions":{"incremental":true},"files":["input.ts"],"exclude":["hidden"]}`,
			},
			edits: []*tscEdit{
				noChange,
				{caption: "change an implicitly imported file", edit: func(sys *TestSys) {
					sys.writeFileNoError("/home/src/workspaces/project/hidden/helper.ts", "export const value=2;\n")
				}},
				{caption: "compile after formatting an implicit input", commandLineArgs: []string{"-p", "."}},
				{caption: "introduce another transitive input", edit: func(sys *TestSys) {
					sys.writeFileNoError("/home/src/workspaces/project/hidden/helper.ts", "import {more} from './more';\nexport const value=more;\n")
					sys.writeFileNoError("/home/src/workspaces/project/hidden/more.ts", "export const more=3;\n")
				}},
				noChange,
			},
		},
	} {
		test.run(t, "formatting")
	}
	for i, args := range [][]string{
		{"--formatDiagnostics", "input.ts"},
		{"--format", "input.ts:1-2"},
		{"--formatOnly", "input.ts:0-2"},
		{"--formatOnly", "input.ts:20-30"},
		{"--formatOnly", "--watch", "input.ts:1-1"},
		{"-b", "--formatDiagnostics", "."},
	} {
		(&tscInput{subScenario: fmt.Sprintf("invalid formatting arguments %d", i), commandLineArgs: args, files: FileMap{file: "const value=1;\n"}}).run(t, "formatting")
	}
}
