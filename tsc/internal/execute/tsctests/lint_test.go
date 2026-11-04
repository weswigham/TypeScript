package tsctests

import (
	"fmt"
	"strconv"
	"strings"
	"testing"

	"github.com/microsoft/TypeScript/tsc/internal/execute"
	"github.com/microsoft/TypeScript/tsc/internal/execute/tsc"
	"github.com/microsoft/TypeScript/tsc/internal/fswatch"
	"gotest.tools/v3/assert"
)

func TestTscLint(t *testing.T) {
	t.Parallel()
	for _, build := range []bool{false, true} {
		for _, only := range []bool{false, true} {
			for _, incremental := range []bool{false, true} {
				t.Run(fmt.Sprintf("build=%v/only=%v/incremental=%v", build, only, incremental), func(t *testing.T) {
					t.Parallel()
					sys := newTestSys(&tscInput{
						cwd: "/app",
						files: FileMap{
							"/app/tsconfig.json": fmt.Sprintf(`{"compilerOptions":{"incremental":%v,"declaration":true},"lint":{"rules":{"no-debugger":"error"}},"files":["input.ts"]}`, incremental || build),
							"/app/input.ts":      "export function f() { debugger; }\ndebugger;\n",
						},
					}, false)
					flag := "--lint"
					if only {
						flag = "--lintOnly"
					}
					args := []string{flag, "-p", "."}
					if build {
						args = []string{flag, "-b", "."}
					}
					for range 2 {
						sys.clearOutput()
						result := execute.CommandLine(t.Context(), sys, args, sys)
						assert.Assert(t, result.Status != tsc.ExitStatusSuccess)
						assert.Equal(t, strings.Count(sys.getOutput(false), "Unexpected 'debugger' statement."), 2)
						assert.Equal(t, sys.FS().FileExists("/app/input.js"), !only)
						assert.Equal(t, sys.FS().FileExists("/app/input.d.ts"), !only)
						assert.Equal(t, sys.FS().FileExists("/app/tsconfig.tsbuildinfo"), !only && (incremental || build))
					}
				})
			}
		}
	}
}

func TestTscLintWatch(t *testing.T) {
	t.Parallel()
	for _, build := range []bool{false, true} {
		for _, only := range []bool{false, true} {
			t.Run(fmt.Sprintf("build=%v/only=%v", build, only), func(t *testing.T) {
				t.Parallel()
				sys := newTestSys(&tscInput{
					cwd: "/app",
					files: FileMap{
						"/app/base.json":     `{"lint":{"rules":{"no-debugger":"error"}}}`,
						"/app/tsconfig.json": `{"extends":"./base.json","compilerOptions":{"incremental":true},"files":["input.ts"]}`,
						"/app/input.ts":      "import './other'; debugger;",
						"/app/other.ts":      "debugger; export {};",
					},
				}, false)
				args := []string{"--lint", "--watch", "-p", "."}
				if only {
					args[0] = "--lintOnly"
				}
				if build {
					args = []string{"-b", "--watch", args[0]}
				}
				result := execute.CommandLine(t.Context(), sys, args, sys)
				assert.Assert(t, result.Watcher != nil)
				assert.Equal(t, strings.Count(sys.getOutput(false), "Unexpected 'debugger' statement."), 2)
				for _, edit := range []struct {
					path    string
					text    string
					reports int
				}{
					{"/app/input.ts", "import './other';", 1},
					{"/app/base.json", `{"lint":{"rules":{"no-debugger":"off"}}}`, 0},
					{"/app/base.json", `{"lint":{"rules":{"no-debugger":"error"}}}`, 1},
					{"/app/other.ts", "export {};", 0},
				} {
					sys.clearOutput()
					sys.writeFileNoError(edit.path, edit.text)
					sys.mockWatchBackend.SendEvents([]fswatch.Event{{Kind: fswatch.EventUpdate, Path: edit.path}})
					result.Watcher.DoCycle(t.Context())
					assert.Equal(t, strings.Count(sys.getOutput(false), "Unexpected 'debugger' statement."), edit.reports)
					assert.Equal(t, sys.FS().FileExists("/app/input.js"), !only)
				}
			})
		}
	}
}

func TestTscLintSeverity(t *testing.T) {
	t.Parallel()
	for _, build := range []bool{false, true} {
		for _, severity := range []string{"off", "warning", "error"} {
			t.Run(fmt.Sprintf("build=%v/%s", build, severity), func(t *testing.T) {
				t.Parallel()
				sys := newTestSys(&tscInput{
					cwd: "/app",
					files: FileMap{
						"/app/tsconfig.json": fmt.Sprintf(`{"lint":{"rules":{"no-debugger":%q}},"files":["input.ts"]}`, severity),
						"/app/input.ts":      "debugger;",
					},
				}, false)
				args := []string{"--lintOnly", "-p", "."}
				if build {
					args = []string{"-b", "--lintOnly"}
				}
				args = append(args, "--pretty", "false")
				result := execute.CommandLine(t.Context(), sys, args, sys)
				assert.Equal(t, result.Status == tsc.ExitStatusSuccess, severity != "error")
				assert.Equal(t, strings.Contains(sys.getOutput(false), "Unexpected 'debugger' statement."), severity != "off")
				if severity == "warning" {
					assert.Assert(t, strings.Contains(sys.getOutput(false), "warning TS18175"))
				}
			})
		}
	}
}

func TestTscLintInputs(t *testing.T) {
	t.Parallel()
	for _, severity := range []string{"error", "off", "unknown"} {
		t.Run(severity, func(t *testing.T) {
			t.Parallel()
			rule := "no-debugger"
			if severity == "unknown" {
				rule, severity = "missing-rule", "error"
			}
			sys := newTestSys(&tscInput{
				cwd: "/app",
				files: FileMap{
					"/app/tsconfig.json":                 fmt.Sprintf(`{"compilerOptions":{"allowJs":true},"lint":{"rules":{%q:%q}},"files":["input.ts","types.d.ts"]}`, rule, severity),
					"/app/input.ts":                      "import 'dep'; debugger;",
					"/app/types.d.ts":                    "declare const text: 'debugger;';",
					"/app/node_modules/dep/package.json": `{"main":"index.js"}`,
					"/app/node_modules/dep/index.js":     "debugger; exports.value = 1;",
				},
			}, false)
			result := execute.CommandLine(t.Context(), sys, []string{"--lintOnly", "-p", "."}, sys)
			output := sys.getOutput(false)
			if rule == "missing-rule" {
				assert.Assert(t, strings.Contains(output, "Unknown lint rule 'missing-rule'."))
			} else {
				expected := 1
				if severity == "off" {
					expected = 0
				}
				assert.Equal(t, strings.Count(output, "Unexpected 'debugger' statement."), expected)
			}
			assert.Equal(t, result.Status == tsc.ExitStatusSuccess, severity == "off")
		})
	}
}

func TestTscLintBaseline(t *testing.T) {
	t.Parallel()
	for _, flag := range []string{"--lint", "--lintOnly"} {
		(&tscInput{
			subScenario:     flag,
			commandLineArgs: []string{flag, "-p", "."},
			files: FileMap{
				"/home/src/workspaces/project/tsconfig.json": `{"lint":{"rules":{"no-debugger":"error"}},"files":["input.ts"]}`,
				"/home/src/workspaces/project/input.ts":      "// debugger;\nexport function inspect() {\n    debugger;\n}\ndebugger;\n",
			},
		}).run(t, "lint")
	}
}

func TestTscLintFix(t *testing.T) {
	t.Parallel()
	for _, build := range []bool{false, true} {
		for _, only := range []bool{false, true} {
			for _, watch := range []bool{false, true} {
				t.Run(fmt.Sprintf("build=%v/only=%v/watch=%v", build, only, watch), func(t *testing.T) {
					t.Parallel()
					const source = "export function inspect() { debugger; }\ndebugger;\n"
					const fixed = "export function inspect() {}\n;\n"
					sys := newTestSys(&tscInput{
						cwd: "/app",
						files: FileMap{
							"/app/tsconfig.json": `{"compilerOptions":{"incremental":true,"declaration":true,"noEmitOnError":true},"lint":{"rules":{"no-debugger":"error"}},"files":["input.ts","other.ts"]}`,
							"/app/input.ts":      source,
							"/app/other.ts":      "debugger; export {};",
						},
					}, false)
					flag := "--lint"
					if only {
						flag = "--lintOnly"
					}
					args := []string{"--fix", flag, "-p", "."}
					if build {
						args = []string{"--fix", flag, "-b", "."}
					}
					if watch {
						args = append(args, "--watch")
					}
					result := execute.CommandLine(t.Context(), sys, args, sys)
					assert.Equal(t, result.Status, tsc.ExitStatusSuccess, "%s", sys.getOutput(false))
					assert.Equal(t, sys.readFileNoError("/app/input.ts"), fixed)
					assert.Equal(t, sys.readFileNoError("/app/other.ts"), "; export {};")
					assert.Assert(t, !strings.Contains(sys.getOutput(false), "Unexpected 'debugger' statement."))
					assert.Equal(t, sys.FS().FileExists("/app/input.js"), !only)
					if !only {
						assert.Assert(t, !strings.Contains(sys.readFileNoError("/app/input.js"), "debugger;"))
					}
					if watch {
						assert.Assert(t, result.Watcher != nil)
						for _, text := range []string{fixed, source, fixed} {
							sys.clearOutput()
							if text == source {
								sys.writeFileNoError("/app/input.ts", text)
							}
							sys.mockWatchBackend.SendEvents([]fswatch.Event{{Kind: fswatch.EventUpdate, Path: "/app/input.ts"}})
							result.Watcher.DoCycle(t.Context())
							assert.Equal(t, sys.readFileNoError("/app/input.ts"), fixed)
							assert.Assert(t, !strings.Contains(sys.getOutput(false), "Unexpected 'debugger' statement."))
							if !only {
								assert.Assert(t, !strings.Contains(sys.readFileNoError("/app/input.js"), "debugger;"))
							}
						}
					}
				})
			}
		}
	}
}

func TestTscLintStopBuildOnErrors(t *testing.T) {
	t.Parallel()
	for _, kind := range []string{"compiler", "lint", "warning"} {
		for _, stop := range []bool{false, true} {
			t.Run(fmt.Sprintf("%s/stop=%v", kind, stop), func(t *testing.T) {
				t.Parallel()
				source := "debugger; export const value = 1;"
				severity := "error"
				if kind == "compiler" {
					source = "export const value: string = 1;"
				} else if kind == "warning" {
					severity = "warning"
				}
				sys := newTestSys(&tscInput{cwd: "/app", files: FileMap{
					"/app/tsconfig.json":          `{"files":[],"references":[{"path":"./lib"},{"path":"./consumer"}]}`,
					"/app/lib/tsconfig.json":      fmt.Sprintf(`{"compilerOptions":{"composite":true},"lint":{"rules":{"no-debugger":%q}},"files":["lib.ts"]}`, severity),
					"/app/lib/lib.ts":             source,
					"/app/consumer/tsconfig.json": `{"compilerOptions":{"composite":true},"references":[{"path":"../lib"}],"files":["consumer.ts"]}`,
					"/app/consumer/consumer.ts":   "import {value} from '../lib/lib'; export const consumer = value;",
				}}, false)
				result := execute.CommandLine(t.Context(), sys, []string{"-b", ".", "--lint", "--stopBuildOnErrors", strconv.FormatBool(stop), "--pretty", "false"}, sys)
				assert.Equal(t, result.Status == tsc.ExitStatusSuccess, kind == "warning", "%s", sys.getOutput(false))
				assert.Equal(t, sys.FS().FileExists("/app/consumer/consumer.js"), !stop || kind == "warning", "%s", sys.getOutput(false))
			})
		}
	}
}
