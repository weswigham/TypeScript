package tsctests

import (
	"context"
	"errors"
	"fmt"
	"io"
	"slices"
	"strings"
	"sync/atomic"
	"testing"

	"github.com/microsoft/TypeScript/tsc/internal/execute"
	"github.com/microsoft/TypeScript/tsc/internal/execute/tsc"
	"github.com/microsoft/TypeScript/tsc/internal/fswatch"
	"github.com/microsoft/TypeScript/tsc/internal/json"
	"github.com/microsoft/TypeScript/tsc/internal/tspath"
	"gotest.tools/v3/assert"
)

type generationSystem struct {
	*TestSys
	calls      atomic.Int32
	stderr     string
	exitError  error
	spawnError error
}

func (sys *generationSystem) Spawn(command []string, directory string, stderr io.Writer) (io.ReadWriteCloser, error) {
	sys.calls.Add(1)
	if sys.spawnError != nil {
		return nil, sys.spawnError
	}
	if !slices.Equal(command[:2], []string{"node", "generate.js"}) {
		return nil, fmt.Errorf("unexpected command: %v", command)
	}
	root := tspath.RootedDirectoryPathFromAbsolute(directory)
	value, ok := sys.FS().ReadFile(root.ResolveFile(command[2]))
	if !ok {
		return nil, errors.New("missing generator input")
	}
	if err := sys.FS().WriteFile(root.ResolveFile("generated/output.ts"), "export const value="+value+";\n"); err != nil {
		return nil, err
	}
	if _, err := io.WriteString(stderr, sys.stderr); err != nil {
		return nil, err
	}
	return &generationProcess{Reader: strings.NewReader(""), exitError: sys.exitError}, nil
}

func (sys *generationSystem) Run(ctx context.Context, command []string, directory string, stdout, stderr io.Writer) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	if len(command) == 3 && command[0] == "copy" {
		sys.calls.Add(1)
		root := tspath.RootedDirectoryPathFromAbsolute(directory)
		text, ok := sys.FS().ReadFile(root.ResolveFile(command[1]))
		if !ok {
			return fmt.Errorf("copy: input file '%s' not found", command[1])
		}
		return sys.FS().WriteFile(root.ResolveFile(command[2]), text)
	}
	process, err := sys.Spawn(command, directory, stderr)
	if err != nil {
		return err
	}
	defer process.Close()
	if _, err := io.Copy(stdout, process); err != nil {
		return err
	}
	return sys.exitError
}

type generationProcess struct {
	io.Reader
	exitError error
}

func (process *generationProcess) Write(data []byte) (int, error) { return len(data), nil }
func (process *generationProcess) Close() error                   { return nil }
func (process *generationProcess) CloseInput() error              { return nil }
func (process *generationProcess) Wait() error                    { return process.exitError }

func TestGenerationBuildModes(t *testing.T) {
	t.Parallel()
	const root = "/home/src/workspaces/project/"
	const input = "/home/src/workspaces/inputs/data.json"
	for _, build := range []bool{false, true} {
		for _, incremental := range []bool{false, true} {
			for _, watch := range []bool{false, true} {
				for _, only := range []bool{false, true} {
					t.Run(fmt.Sprintf("build=%v/incremental=%v/watch=%v/only=%v", build, incremental, watch, only), func(t *testing.T) {
						t.Parallel()
						testSys := newTestSys(&tscInput{files: FileMap{
							root + "tsconfig.json": fmt.Sprintf(`{"compilerOptions":{"incremental":%v,"tsBuildInfoFile":"cache.tsbuildinfo"},"include":["generated/**/*.ts"],"generate":[{"inputs":["../inputs/data.json"],"outputs":["generated/**/*.ts"],"command":["node","generate.js","${inputs}"]}]}`, incremental),
							input:                  "1",
						}}, false)
						sys := &generationSystem{TestSys: testSys}
						args := []string{"--generate", "--runExternalCode", "--pretty", "false"}
						if only {
							args[0] = "--generateOnly"
						} else {
							args = append(args, "--format")
						}
						if build {
							args = append([]string{"--build"}, args...)
						}
						if watch {
							args = append(args, "--watch")
						}
						result := execute.CommandLine(t.Context(), sys, args, testSys)
						assert.Equal(t, result.Status, tsc.ExitStatusSuccess, testSys.getOutput(false))
						assert.Equal(t, sys.calls.Load(), int32(1), testSys.getOutput(false))
						wantSource := "export const value = 1;\n"
						if only {
							wantSource = "export const value=1;\n"
						}
						assert.Equal(t, testSys.readFileNoError(root+"generated/output.ts"), wantSource)
						assert.Equal(t, sys.FS().FileExists(tspath.RootedFilePath(root+"generated/output.js")), !only)
						if watch {
							assert.Assert(t, result.Watcher != nil)
							testSys.mockWatchBackend.SendEvents([]fswatch.Event{{Kind: fswatch.EventUpdate, Path: root + "generated/output.ts"}})
							result.Watcher.DoCycle(t.Context())
						} else {
							result = execute.CommandLine(t.Context(), sys, args, testSys)
							assert.Equal(t, result.Status, tsc.ExitStatusSuccess, testSys.getOutput(false))
						}
						cached := incremental || build || watch
						wantCalls := int32(1)
						if !cached {
							wantCalls++
						}
						assert.Equal(t, sys.calls.Load(), wantCalls, testSys.getOutput(false))
						testSys.writeFileNoError(input, "2")
						if watch {
							testSys.mockWatchBackend.SendEvents([]fswatch.Event{{Kind: fswatch.EventUpdate, Path: input}})
							result.Watcher.DoCycle(t.Context())
						} else {
							result = execute.CommandLine(t.Context(), sys, args, testSys)
							assert.Equal(t, result.Status, tsc.ExitStatusSuccess, testSys.getOutput(false))
						}
						assert.Equal(t, sys.calls.Load(), wantCalls+1, testSys.getOutput(false))
						assert.Equal(t, testSys.readFileNoError(root+"generated/output.ts"), strings.ReplaceAll(wantSource, "1", "2"))
						if !only {
							assert.Assert(t, strings.Contains(testSys.readFileNoError(root+"generated/output.js"), "value = 2"))
						}
					})
				}
			}
		}
	}
}

func TestGenerationFileKinds(t *testing.T) {
	t.Parallel()
	const root = "/home/src/workspaces/project/"
	kinds := []struct{ extension, initial, changed string }{
		{".json", "{\"value\":1}\n", "{\"value\":2}\n"},
		{".tsx", "export const value = <div>1</div>;\n", "export const value = <div>2</div>;\n"},
		{".d.ts", "export declare const value: 1;\n", "export declare const value: 2;\n"},
		{".yaml", "value: 1\n", "value: 2\n"},
		{".sql", "SELECT 1 AS value;\n", "SELECT 2 AS value;\n"},
	}
	for _, inputKind := range kinds {
		for _, outputKind := range kinds {
			for _, glob := range []bool{false, true} {
				for _, build := range []bool{false, true} {
					for _, watch := range []bool{false, true} {
						t.Run(fmt.Sprintf("%s-to-%s/glob=%v/build=%v/watch=%v", strings.TrimPrefix(inputKind.extension, "."), strings.TrimPrefix(outputKind.extension, "."), glob, build, watch), func(t *testing.T) {
							t.Parallel()
							input := "../inputs/nested/input" + inputKind.extension
							output := "generated/nested/output" + outputKind.extension
							directory := tspath.RootedDirectoryPathFromAbsolute(root)
							inputPath := directory.ResolveFile(input)
							outputPath := directory.ResolveFile(output)
							inputPattern, outputPattern := input, output
							if glob {
								inputPattern = "../inputs/**/*" + inputKind.extension
								outputPattern = "generated/**/*" + outputKind.extension
							}
							configuration, err := json.Marshal(map[string]any{
								"compilerOptions": map[string]any{"incremental": true, "tsBuildInfoFile": "cache.tsbuildinfo"},
								"files":           []string{"main.ts"},
								"generate":        []any{map[string]any{"inputs": []string{inputPattern}, "outputs": []string{outputPattern}, "command": []string{"copy", input, output}}},
							})
							assert.NilError(t, err)
							testSys := newTestSys(&tscInput{files: FileMap{
								root + "tsconfig.json": string(configuration), root + "main.ts": "export const main = 1;\n", inputPath.AsString(): inputKind.initial,
							}}, false)
							sys := &generationSystem{TestSys: testSys}
							args := []string{"--generate", "--runExternalCode", "--pretty", "false"}
							if build {
								args = append([]string{"-b"}, args...)
							}
							if watch {
								args = append(args, "--watch")
							}
							var watcher tsc.Watcher
							run := func(path tspath.RootedPath, kind fswatch.EventKind, calls int32, content string) {
								t.Helper()
								testSys.clearOutput()
								if watcher == nil {
									result := execute.CommandLine(t.Context(), sys, args, testSys)
									assert.Equal(t, result.Status, tsc.ExitStatusSuccess, testSys.getOutput(false))
									watcher = result.Watcher
									if watch {
										assert.Assert(t, watcher != nil)
									}
								} else {
									testSys.mockWatchBackend.SendEvents([]fswatch.Event{{Kind: kind, Path: path.AsString()}})
									watcher.DoCycle(t.Context())
									assert.Assert(t, !strings.Contains(testSys.getOutput(false), "error TS"), testSys.getOutput(false))
								}
								assert.Equal(t, sys.calls.Load(), calls, testSys.getOutput(false))
								assert.Equal(t, testSys.readFileNoError(outputPath.AsString()), content)
							}
							run(inputPath.AsPath(), fswatch.EventUpdate, 1, inputKind.initial)
							run(inputPath.AsPath(), fswatch.EventUpdate, 1, inputKind.initial)
							info := sys.FS().Stat(inputPath.AsPath())
							assert.Assert(t, info != nil)
							assert.NilError(t, sys.FS().Chtimes(inputPath.AsPath(), info.ModTime(), sys.Now()))
							run(inputPath.AsPath(), fswatch.EventUpdate, 1, inputKind.initial)
							testSys.writeFileNoError(inputPath.AsString(), inputKind.changed)
							run(inputPath.AsPath(), fswatch.EventUpdate, 2, inputKind.changed)
							testSys.writeFileNoError(outputPath.AsString(), "external edit\n")
							run(outputPath.AsPath(), fswatch.EventUpdate, 3, inputKind.changed)
							assert.NilError(t, sys.FS().Remove(outputPath.AsPath()))
							run(outputPath.AsPath(), fswatch.EventDelete, 4, inputKind.changed)
							run(outputPath.AsPath(), fswatch.EventUpdate, 4, inputKind.changed)
							if glob {
								extra := inputPath.Directory().ResolveFile("extra" + inputKind.extension)
								testSys.writeFileNoError(extra.AsString(), inputKind.initial)
								run(extra.AsPath(), fswatch.EventUpdate, 5, inputKind.changed)
								assert.NilError(t, sys.FS().Remove(extra.AsPath()))
								run(extra.AsPath(), fswatch.EventDelete, 6, inputKind.changed)
								run(inputPath.AsPath(), fswatch.EventUpdate, 6, inputKind.changed)
							}
						})
					}
				}
			}
		}
	}
}

func TestGenerationFileKindsFormatting(t *testing.T) {
	t.Parallel()
	const root = "/home/src/workspaces/project/"
	for _, kind := range []struct{ extension, initial, changed, main string }{
		{".json", "{\"value\":1}\n", "{\"value\":2}\n", "import data from './generated/output.json'; export const value = data.value;\n"},
		{".tsx", "export const value=<div>1</div>;\n", "export const value=<div>2</div>;\n", "import { value } from './generated/output'; export const result = value;\n"},
		{".d.ts", "export interface Value{value:number;label?:string;}\n", "export interface Value{value:number;label?:number;}\n", "import type { Value } from './generated/output'; export const result: Value = { value: 1 };\n"},
	} {
		for _, build := range []bool{false, true} {
			for _, watch := range []bool{false, true} {
				t.Run(fmt.Sprintf("%s/build=%v/watch=%v", strings.TrimPrefix(kind.extension, "."), build, watch), func(t *testing.T) {
					t.Parallel()
					input := "templates/input" + kind.extension
					output := "generated/output" + kind.extension
					configuration, err := json.Marshal(map[string]any{
						"compilerOptions": map[string]any{"incremental": true, "tsBuildInfoFile": "cache.tsbuildinfo", "outDir": "dist", "target": "esnext", "module": "esnext", "moduleResolution": "bundler", "jsx": "preserve", "resolveJsonModule": true},
						"files":           []string{"main.ts", "jsx.d.ts"},
						"generate":        []any{map[string]any{"inputs": []string{input}, "outputs": []string{output}, "command": []string{"copy", "${inputs}", output}}},
					})
					assert.NilError(t, err)
					testSys := newTestSys(&tscInput{files: FileMap{
						root + "tsconfig.json": string(configuration), root + "main.ts": kind.main, root + input: kind.initial,
						root + "jsx.d.ts": "declare namespace JSX { interface Element {} interface IntrinsicElements { div: { children?: number }; } }\n",
					}}, false)
					sys := &generationSystem{TestSys: testSys}
					args := []string{"--generate", "--format", "--runExternalCode", "--pretty", "false"}
					if build {
						args = append([]string{"-b"}, args...)
					}
					if watch {
						args = append(args, "--watch")
					}
					var watcher tsc.Watcher
					run := func(name string, calls int32) {
						t.Helper()
						testSys.clearOutput()
						if watcher == nil {
							result := execute.CommandLine(t.Context(), sys, args, testSys)
							assert.Equal(t, result.Status, tsc.ExitStatusSuccess, testSys.getOutput(false))
							watcher = result.Watcher
							if watch {
								assert.Assert(t, watcher != nil)
							}
						} else {
							testSys.mockWatchBackend.SendEvents([]fswatch.Event{{Kind: fswatch.EventUpdate, Path: root + name}})
							watcher.DoCycle(t.Context())
							assert.Assert(t, !strings.Contains(testSys.getOutput(false), "error TS"), testSys.getOutput(false))
						}
						assert.Equal(t, sys.calls.Load(), calls, testSys.getOutput(false))
					}
					run(input, 1)
					formatted := testSys.readFileNoError(root + output)
					assert.Assert(t, formatted != kind.initial)
					run(output, 1)
					assert.Equal(t, testSys.readFileNoError(root+output), formatted)
					testSys.writeFileNoError(root+input, kind.changed)
					run(input, 2)
					changed := testSys.readFileNoError(root + output)
					assert.Assert(t, changed != formatted)
					run(output, 2)
					assert.Equal(t, testSys.readFileNoError(root+output), changed)
					assert.Assert(t, sys.FS().FileExists(root+"dist/main.js"))
				})
			}
		}
	}
}

func TestGenerationOnlyWithFormatOnly(t *testing.T) {
	t.Parallel()
	const root = "/home/src/workspaces/project/"
	const source = "export const value=1;\n"
	for _, flags := range [][]string{{"--generateOnly", "--formatOnly"}, {"--generateOnly", "--format"}, {"--formatOnly", "--generate"}} {
		for _, build := range []bool{false, true} {
			for _, watch := range []bool{false, true} {
				t.Run(fmt.Sprintf("%s/build=%v/watch=%v", strings.Join(flags, "+"), build, watch), func(t *testing.T) {
					t.Parallel()
					testSys := newTestSys(&tscInput{files: FileMap{
						root + "tsconfig.json": `{"files":["main.ts"],"generate":[{"inputs":["data.json"],"outputs":["generated/*.ts"],"command":["node","generate.js","${inputs}"]}]}`,
						root + "main.ts":       source,
						root + "data.json":     "1",
					}}, false)
					sys := &generationSystem{TestSys: testSys}
					args := append(slices.Clone(flags), "--runExternalCode", "--pretty", "false")
					if build {
						args = append([]string{"-b"}, args...)
					}
					if watch {
						args = append(args, "--watch")
					}
					result := execute.CommandLine(t.Context(), sys, args, testSys)
					assert.Assert(t, result.Status != tsc.ExitStatusSuccess, testSys.getOutput(false))
					assert.Assert(t, result.Watcher == nil)
					assert.Equal(t, sys.calls.Load(), int32(0))
					assert.Equal(t, testSys.readFileNoError(root+"main.ts"), source)
					assert.Assert(t, !sys.FS().FileExists(root+"generated/output.ts"))
					assert.Assert(t, strings.Contains(testSys.getOutput(false), "cannot be combined"), testSys.getOutput(false))
				})
			}
		}
	}
}

func TestGenerationStopsBuild(t *testing.T) {
	t.Parallel()
	const root = "/home/src/workspaces/project/"
	for _, build := range []bool{false, true} {
		for _, failure := range []string{"permission", "stderr", "exit", "spawn"} {
			t.Run(fmt.Sprintf("build=%v/%s", build, failure), func(t *testing.T) {
				t.Parallel()
				testSys := newTestSys(&tscInput{files: FileMap{
					root + "tsconfig.json": `{"files":["main.ts"],"generate":[{"inputs":["data.json"],"outputs":["generated/**/*.ts"],"command":["node","generate.js","${inputs}"]}]}`,
					root + "main.ts":       "export const main=1;\n",
					root + "data.json":     "1",
				}}, false)
				sys := &generationSystem{TestSys: testSys}
				args := []string{"--generate", "--format", "--pretty", "false"}
				if failure != "permission" {
					args = append(args, "--runExternalCode")
				}
				switch failure {
				case "stderr":
					sys.stderr = "generator error"
				case "exit":
					sys.exitError = errors.New("exit status 2")
				case "spawn":
					sys.spawnError = errors.New("executable not found")
				}
				if build {
					args = append([]string{"--build"}, args...)
				}
				result := execute.CommandLine(t.Context(), sys, args, testSys)
				assert.Assert(t, result.Status != tsc.ExitStatusSuccess)
				assert.Assert(t, !sys.FS().FileExists(root+"main.js"))
				assert.Equal(t, testSys.readFileNoError(root+"main.ts"), "export const main=1;\n")
			})
		}
	}
}

func TestGenerationOnlyThenCompile(t *testing.T) {
	t.Parallel()
	const root = "/home/src/workspaces/project/"
	for _, build := range []bool{false, true} {
		t.Run(fmt.Sprintf("build=%v", build), func(t *testing.T) {
			t.Parallel()
			testSys := newTestSys(&tscInput{files: FileMap{
				root + "tsconfig.json": `{"compilerOptions":{"incremental":true},"include":["generated/*.ts"],"generate":[{"inputs":["data.json"],"outputs":["generated/*.ts"],"command":["node","generate.js","${inputs}"]}]}`,
				root + "data.json":     "1",
			}}, false)
			sys := &generationSystem{TestSys: testSys}
			for _, flags := range [][]string{{"--generateOnly", "--runExternalCode"}, {}, {"--generate", "--format", "--runExternalCode"}, {"--generate", "--format", "--runExternalCode"}} {
				args := slices.Clone(flags)
				if build {
					args = append([]string{"-b"}, args...)
				}
				result := execute.CommandLine(t.Context(), sys, args, testSys)
				assert.Equal(t, result.Status, tsc.ExitStatusSuccess, testSys.getOutput(false))
				assert.Equal(t, sys.calls.Load(), int32(1), testSys.getOutput(false))
			}
			assert.Assert(t, sys.FS().FileExists(root+"generated/output.js"))
		})
	}
}

func TestGenerationShowConfigRoundTrip(t *testing.T) {
	t.Parallel()
	const root = "/home/src/workspaces/project/"
	testSys := newTestSys(&tscInput{files: FileMap{
		root + "tsconfig.json":      `{"extends":"./base/tsconfig.json","files":["main.ts"]}`,
		root + "base/tsconfig.json": `{"generate":[{"inputs":["data.json"],"outputs":["generated/*.ts"],"command":["node","generate.js","${inputs}"]}]}`,
		root + "base/data.json":     "1",
		root + "main.ts":            "export {};",
	}}, false)
	sys := &generationSystem{TestSys: testSys}
	shown := execute.CommandLine(t.Context(), sys, []string{"--showConfig"}, testSys)
	assert.Equal(t, shown.Status, tsc.ExitStatusSuccess)
	var config map[string]any
	assert.NilError(t, json.Unmarshal([]byte(testSys.currentWrite.String()), &config))
	testSys.writeFileNoError(root+"flat.json", testSys.currentWrite.String())
	for _, name := range []string{"tsconfig.json", "flat.json"} {
		testSys.clearOutput()
		result := execute.CommandLine(t.Context(), sys, []string{"-p", name, "--generateOnly", "--runExternalCode"}, testSys)
		assert.Equal(t, result.Status, tsc.ExitStatusSuccess, testSys.getOutput(false))
		assert.Equal(t, testSys.readFileNoError(root+"base/generated/output.ts"), "export const value=1;\n")
		assert.Assert(t, !sys.FS().FileExists(root+"generated/output.ts"))
	}
	assert.Equal(t, sys.calls.Load(), int32(2))
}

func TestGenerationWatchRecovery(t *testing.T) {
	t.Parallel()
	const root = "/home/src/workspaces/project/"
	for _, build := range []bool{false, true} {
		t.Run(fmt.Sprintf("build=%v", build), func(t *testing.T) {
			t.Parallel()
			testSys := newTestSys(&tscInput{files: FileMap{
				root + "tsconfig.json": `{"compilerOptions":{"incremental":true},"include":["generated/*.ts"],"generate":[{"inputs":["data.json"],"outputs":["generated/*.ts"],"command":["node","generate.js","${inputs}"]}]}`,
				root + "data.json":     "1",
			}}, false)
			sys := &generationSystem{TestSys: testSys, stderr: "generation failed"}
			args := []string{"--generate", "--format", "--runExternalCode", "--watch"}
			if build {
				args = append([]string{"-b"}, args...)
			}
			result := execute.CommandLine(t.Context(), sys, args, testSys)
			assert.Assert(t, result.Watcher != nil)
			assert.Assert(t, !sys.FS().FileExists(root+"generated/output.js"))
			sys.stderr = ""
			testSys.writeFileNoError(root+"data.json", "2")
			testSys.mockWatchBackend.SendEvents([]fswatch.Event{{Kind: fswatch.EventUpdate, Path: root + "data.json"}})
			result.Watcher.DoCycle(t.Context())
			assert.Equal(t, sys.calls.Load(), int32(2), testSys.getOutput(false))
			assert.Assert(t, strings.Contains(testSys.readFileNoError(root+"generated/output.js"), "value = 2"))
		})
	}
}

func TestGenerationProjectOutputConflict(t *testing.T) {
	t.Parallel()
	const root = "/home/src/workspaces/project/"
	testSys := newTestSys(&tscInput{files: FileMap{
		root + "tsconfig.json":        `{"files":[],"references":[{"path":"./first"},{"path":"./second"}]}`,
		root + "first/tsconfig.json":  `{"generate":[{"inputs":["input.json"],"outputs":["../shared/foo*.ts"],"command":["node","generate.js","${inputs}"]}]}`,
		root + "second/tsconfig.json": `{"generate":[{"inputs":["input.json"],"outputs":["../shared/*bar.ts"],"command":["node","generate.js","${inputs}"]}]}`,
	}}, false)
	sys := &generationSystem{TestSys: testSys}
	result := execute.CommandLine(t.Context(), sys, []string{"--generateOnly", "-b", "--runExternalCode", "--pretty", "false"}, testSys)
	assert.Assert(t, result.Status != tsc.ExitStatusSuccess)
	assert.Equal(t, sys.calls.Load(), int32(0))
	assert.Assert(t, strings.Contains(testSys.getOutput(false), "overlap"), testSys.getOutput(false))
}

func TestGenerationOnlyInvalidConfig(t *testing.T) {
	t.Parallel()
	const root = "/home/src/workspaces/project/"
	for _, build := range []bool{false, true} {
		t.Run(fmt.Sprintf("build=%v", build), func(t *testing.T) {
			t.Parallel()
			testSys := newTestSys(&tscInput{files: FileMap{root + "tsconfig.json": `{"generate":[{"command":true}]}`}}, false)
			sys := &generationSystem{TestSys: testSys}
			args := []string{"--generateOnly", "--runExternalCode"}
			if build {
				args = append([]string{"-b"}, args...)
			}
			result := execute.CommandLine(t.Context(), sys, args, testSys)
			assert.Assert(t, result.Status != tsc.ExitStatusSuccess)
			assert.Equal(t, sys.calls.Load(), int32(0))
		})
	}
}

func TestGenerationFailureStopsDependents(t *testing.T) {
	t.Parallel()
	const root = "/home/src/workspaces/project/"
	testSys := newTestSys(&tscInput{files: FileMap{
		root + "tsconfig.json":           `{"files":[],"references":[{"path":"./dependent"}]}`,
		root + "upstream/tsconfig.json":  `{"compilerOptions":{"composite":true},"include":["generated/*.ts"],"generate":[{"inputs":["input.json"],"outputs":["generated/*.ts"],"command":["node","generate.js","${inputs}"]}]}`,
		root + "upstream/input.json":     "1",
		root + "dependent/tsconfig.json": `{"compilerOptions":{"composite":true},"files":["main.ts"],"references":[{"path":"../upstream"}]}`,
		root + "dependent/main.ts":       "export const value = 1;\n",
	}}, false)
	sys := &generationSystem{TestSys: testSys, stderr: "generation failed"}
	result := execute.CommandLine(t.Context(), sys, []string{"-b", "--generate", "--runExternalCode"}, testSys)
	assert.Assert(t, result.Status != tsc.ExitStatusSuccess)
	assert.Equal(t, sys.calls.Load(), int32(1))
	assert.Assert(t, !sys.FS().FileExists(root+"dependent/main.js"))
}

func TestGenerationBuildInfoInputCollision(t *testing.T) {
	t.Parallel()
	const root = "/home/src/workspaces/project/"
	const source = "import { value } from './dependency';\nexport const result = value;\n"
	for _, build := range []bool{false, true} {
		for _, flag := range []string{"--generate", "--generateOnly"} {
			for _, target := range []string{"main.ts", "dependency.d.ts", "data.json", "tsconfig.json"} {
				t.Run(fmt.Sprintf("build=%v/%s/%s", build, flag, target), func(t *testing.T) {
					t.Parallel()
					testSys := newTestSys(&tscInput{files: FileMap{
						root + "tsconfig.json":   fmt.Sprintf(`{"compilerOptions":{"incremental":true,"tsBuildInfoFile":"%s"},"files":["main.ts"],"generate":[{"inputs":["data.json"],"outputs":["generated/*.ts"],"command":["node","generate.js","${inputs}"]}]}`, target),
						root + "main.ts":         source,
						root + "dependency.d.ts": "export declare const value: number;\n",
						root + "data.json":       "1",
					}}, false)
					original := testSys.readFileNoError(root + target)
					sys := &generationSystem{TestSys: testSys}
					args := []string{flag, "--runExternalCode", "--pretty", "false"}
					if build {
						args = append([]string{"-b"}, args...)
					}
					result := execute.CommandLine(t.Context(), sys, args, testSys)
					assert.Assert(t, result.Status != tsc.ExitStatusSuccess, testSys.getOutput(false))
					assert.Equal(t, testSys.readFileNoError(root+target), original)
					assert.Equal(t, testSys.readFileNoError(root+"main.ts"), source)
					assert.Assert(t, strings.Contains(testSys.getOutput(false), "overwrite input file"), testSys.getOutput(false))
				})
			}
		}
	}
}

func TestGenerationWatchDirectoryRemoval(t *testing.T) {
	t.Parallel()
	const root = "/home/src/workspaces/project/"
	const inputDirectory = "/home/src/workspaces/inputs/nested"
	for _, build := range []bool{false, true} {
		t.Run(fmt.Sprintf("build=%v", build), func(t *testing.T) {
			t.Parallel()
			testSys := newTestSys(&tscInput{files: FileMap{
				root + "tsconfig.json":        `{"compilerOptions":{"incremental":true},"include":["generated/*.ts"],"generate":[{"inputs":["../inputs/**/*.json"],"outputs":["generated/*.ts"],"command":["node","generate.js","../inputs/nested/data.json"]}]}`,
				inputDirectory + "/data.json": "1",
			}}, false)
			sys := &generationSystem{TestSys: testSys}
			args := []string{"--generate", "--runExternalCode", "--watch", "--pretty", "false"}
			if build {
				args = append([]string{"-b"}, args...)
			}
			result := execute.CommandLine(t.Context(), sys, args, testSys)
			assert.Assert(t, result.Watcher != nil)
			assert.Equal(t, sys.calls.Load(), int32(1), testSys.getOutput(false))
			assert.NilError(t, sys.FS().Remove(inputDirectory))
			testSys.mockWatchBackend.SendEvents([]fswatch.Event{{Kind: fswatch.EventDelete, Path: inputDirectory}})
			result.Watcher.DoCycle(t.Context())
			assert.Equal(t, sys.calls.Load(), int32(2), testSys.getOutput(false))
			assert.Assert(t, strings.Contains(testSys.getOutput(false), "missing generator input"))
			testSys.writeFileNoError(inputDirectory+"/data.json", "2")
			testSys.mockWatchBackend.SendEvents([]fswatch.Event{{Kind: fswatch.EventUpdate, Path: inputDirectory}})
			result.Watcher.DoCycle(t.Context())
			assert.Equal(t, sys.calls.Load(), int32(3), testSys.getOutput(false))
			assert.Assert(t, strings.Contains(testSys.readFileNoError(root+"generated/output.js"), "value = 2"))
		})
	}
}

func TestGenerationClean(t *testing.T) {
	t.Parallel()
	const root = "/home/src/workspaces/project/"
	for _, dry := range []bool{false, true} {
		t.Run(fmt.Sprintf("dry=%v", dry), func(t *testing.T) {
			t.Parallel()
			testSys := newTestSys(&tscInput{files: FileMap{
				root + "tsconfig.json":                               `{"compilerOptions":{"composite":true,"tsBuildInfoFile":"cache.tsbuildinfo","outDir":"dist"},"files":["main.ts","generated/output.ts"],"generate":[{"inputs":["data.json"],"outputs":["generated/**/*.ts","generated/metadata.json","../shared/generated/*.txt"],"command":["node","generate.js","${inputs}"]}]}`,
				root + "main.ts":                                     "export const main = 1;",
				root + "data.json":                                   "1",
				root + "generated/output.ts":                         "export const value = 1;",
				root + "generated/nested/other.ts":                   "export const other = 1;",
				root + "generated/metadata.json":                     "{}",
				root + "generated/keep.txt":                          "keep",
				root + "dist/main.js":                                "export const main = 1;",
				root + "dist/main.d.ts":                              "export declare const main = 1;",
				root + "dist/generated/output.js":                    "export const value = 1;",
				root + "dist/generated/output.d.ts":                  "export declare const value = 1;",
				root + "cache.tsbuildinfo":                           "{}",
				"/home/src/workspaces/shared/generated/manifest.txt": "generated",
			}}, false)
			sys := &generationSystem{TestSys: testSys}
			args := []string{"-b", "--clean", "--pretty", "false"}
			if dry {
				args = append(args, "--dry")
			}
			result := execute.CommandLine(t.Context(), sys, args, testSys)
			assert.Equal(t, result.Status, tsc.ExitStatusSuccess, testSys.getOutput(false))
			assert.Equal(t, sys.calls.Load(), int32(0))
			for _, name := range []tspath.RootedFilePath{
				root + "generated/output.ts", root + "generated/nested/other.ts", root + "generated/metadata.json",
				root + "dist/main.js", root + "dist/main.d.ts", root + "dist/generated/output.js", root + "dist/generated/output.d.ts",
				root + "cache.tsbuildinfo", "/home/src/workspaces/shared/generated/manifest.txt",
			} {
				assert.Equal(t, sys.FS().FileExists(name), dry, name.AsString())
				if dry {
					assert.Assert(t, strings.Contains(testSys.getOutput(false), name.BaseName()), testSys.getOutput(false))
				}
			}
			assert.Equal(t, testSys.readFileNoError(root+"main.ts"), "export const main = 1;")
			assert.Equal(t, testSys.readFileNoError(root+"data.json"), "1")
			assert.Equal(t, testSys.readFileNoError(root+"generated/keep.txt"), "keep")
		})
	}
}

func TestGenerationCancellation(t *testing.T) {
	t.Parallel()
	const root = "/home/src/workspaces/project/"
	for _, build := range []bool{false, true} {
		for _, watch := range []bool{false, true} {
			t.Run(fmt.Sprintf("build=%v/watch=%v", build, watch), func(t *testing.T) {
				t.Parallel()
				testSys := newTestSys(&tscInput{files: FileMap{
					root + "tsconfig.json": `{"include":["generated/*.ts"],"generate":[{"inputs":["data.json"],"outputs":["generated/*.ts"],"command":["node","generate.js","${inputs}"]}]}`,
					root + "data.json":     "1",
				}}, false)
				sys := &generationSystem{TestSys: testSys}
				ctx, cancel := context.WithCancel(t.Context())
				defer cancel()
				args := []string{"--generateOnly", "--runExternalCode", "--pretty", "false"}
				if build {
					args = append([]string{"-b"}, args...)
				}
				if watch {
					args = append(args, "--watch")
				} else {
					cancel()
				}
				result := execute.CommandLine(ctx, sys, args, testSys)
				if watch {
					assert.Assert(t, result.Watcher != nil)
					assert.Equal(t, sys.calls.Load(), int32(1))
					cancel()
					testSys.writeFileNoError(root+"data.json", "2")
					testSys.mockWatchBackend.SendEvents([]fswatch.Event{{Kind: fswatch.EventUpdate, Path: root + "data.json"}})
					result.Watcher.DoCycle(ctx)
					assert.Equal(t, sys.calls.Load(), int32(1))
				} else {
					assert.Assert(t, result.Status != tsc.ExitStatusSuccess)
					assert.Equal(t, sys.calls.Load(), int32(0))
				}
				assert.Assert(t, strings.Contains(testSys.getOutput(false), "context canceled"), testSys.getOutput(false))
			})
		}
	}
}

func TestGenerationExtendedDiagnostics(t *testing.T) {
	t.Parallel()
	const root = "/home/src/workspaces/project/"
	for _, build := range []bool{false, true} {
		for _, watch := range []bool{false, true} {
			for _, only := range []bool{false, true} {
				t.Run(fmt.Sprintf("build=%v/watch=%v/only=%v", build, watch, only), func(t *testing.T) {
					t.Parallel()
					testSys := newTestSys(&tscInput{files: FileMap{
						root + "tsconfig.json": `{"include":["generated/*.ts"],"generate":[{"inputs":["data.json"],"outputs":["generated/*.ts"],"command":["node","generate.js","${inputs}"]}]}`,
						root + "data.json":     "1",
					}}, false)
					sys := &generationSystem{TestSys: testSys}
					args := []string{"--generate", "--runExternalCode", "--extendedDiagnostics"}
					if only {
						args[0] = "--generateOnly"
					}
					if build {
						args = append([]string{"-b"}, args...)
					}
					if watch {
						args = append(args, "--watch")
					}
					result := execute.CommandLine(t.Context(), sys, args, testSys)
					assert.Equal(t, result.Status, tsc.ExitStatusSuccess, testSys.getOutput(false))
					output := testSys.currentWrite.String()
					assert.Assert(t, strings.Contains(output, "Generate node generate.js data.json time:"), output)
					if build {
						assert.Assert(t, strings.Contains(output, "Aggregate Generate commands:"), output)
					}
				})
			}
		}
	}
}
