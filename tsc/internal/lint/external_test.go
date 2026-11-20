package lint

import (
	"context"
	"errors"
	"strings"
	"sync/atomic"
	"testing"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/bundled"
	"github.com/microsoft/TypeScript/tsc/internal/compiler"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	linthost "github.com/microsoft/TypeScript/tsc/internal/lint/host"
	"github.com/microsoft/TypeScript/tsc/internal/parser"
	"github.com/microsoft/TypeScript/tsc/internal/tsoptions"
	"github.com/microsoft/TypeScript/tsc/internal/tspath"
	"github.com/microsoft/TypeScript/tsc/internal/vfs/vfstest"
	"gotest.tools/v3/assert"
)

type countingLintSpawner struct{ starts atomic.Int32 }

func (s *countingLintSpawner) InspectPlugins(context.Context, linthost.PluginOptions) ([]string, error) {
	s.starts.Add(1)
	return nil, errors.New("unexpected lint process")
}

func (s *countingLintSpawner) LintBatch(context.Context, *compiler.Program, linthost.PluginOptions, map[string]any, []*ast.SourceFile) (*linthost.BatchResult, error) {
	s.starts.Add(1)
	return nil, errors.New("unexpected lint process")
}
func (*countingLintSpawner) Workers() int { return 1 }
func (*countingLintSpawner) Close() error { return nil }

func TestLintPluginsRequireAuthorization(t *testing.T) {
	t.Parallel()
	spawner := &countingLintSpawner{}
	host := spawner
	defer host.Close()
	fs := bundled.WrapFS(vfstest.FromMap(map[string]string{
		"/project/input.ts":      "debugger;",
		"/project/tsconfig.json": `{"files":["input.ts"],"lint":{"plugins":{"local":"./rules.mjs"},"rules":{"local/example":"error"}}}`,
	}, tspath.CaseSensitive))
	config, errors := tsoptions.GetParsedCommandLineOfConfigFile("/project/tsconfig.json", &core.CompilerOptions{LintOnly: core.TSTrue}, nil, tsoptions.NewDefaultParseConfigHost(fs), nil)
	assert.Equal(t, len(errors), 0)
	assert.Equal(t, len(config.Errors), 0)
	program := compiler.NewProgram(compiler.ProgramOptions{Config: config, Host: compiler.NewCompilerHost(fs, bundled.LibPath(), nil, nil, nil)})
	reports := GetDiagnostics(WithHost(t.Context(), host), program)
	assert.Equal(t, len(reports), 1)
	assert.Equal(t, reports[0].Code(), diagnostics.Lint_plugins_require_the_runExternalCode_command_line_flag_to_be_enabled.Code())
	assert.Equal(t, spawner.starts.Load(), int32(0))
}

func TestLintNativeFileOverridesAndIgnores(t *testing.T) {
	t.Parallel()
	const source = `debugger; console.warn("allowed"); console.error("reported");`
	fs := bundled.WrapFS(vfstest.FromMap(map[string]string{
		"/project/first.ts": source,
		"/project/other.ts": source,
		"/project/skip.ts":  source,
		"/project/tsconfig.json": `{
			"files":["first.ts","other.ts","skip.ts"],
			"lint":{
				"rules":{"no-debugger":"error","no-console":["error",{"allow":["warn"]}]},
				"ignores":["./skip.ts"],
				"overrides":[
					{"files":["./*.ts"],"rules":{"no-debugger":"warn","no-console":"warn"}},
					{"files":["./other.ts"],"rules":{"no-debugger":"off"}}
				]
			}
		}`,
	}, tspath.CaseSensitive))
	config, errors := tsoptions.GetParsedCommandLineOfConfigFile("/project/tsconfig.json", &core.CompilerOptions{LintOnly: core.TSTrue}, nil, tsoptions.NewDefaultParseConfigHost(fs), nil)
	assert.Equal(t, len(errors), 0)
	assert.Equal(t, len(config.Errors), 0)
	program := compiler.NewProgram(compiler.ProgramOptions{Config: config, Host: compiler.NewCompilerHost(fs, bundled.LibPath(), nil, nil, nil)})
	reports := GetDiagnostics(t.Context(), program)
	assert.Equal(t, len(reports), 3)
	for _, report := range reports {
		assert.Equal(t, report.Category(), diagnostics.CategoryWarning)
		assert.Assert(t, report.File().FileName() != "/project/skip.ts")
		if report.Code() == diagnostics.Unexpected_debugger_statement.Code() {
			assert.Equal(t, report.File().FileName(), tspath.RootedFilePath("/project/first.ts"))
		}
	}
}

func TestLintExternalUTF16ReportsAndFixes(t *testing.T) {
	t.Parallel()
	const source = "const value = '\U0001F600'; debugger;"
	file := parser.ParseSourceFile(ast.SourceFileParseOptions{FileName: "/input.ts", PathKey: "/input.ts"}, source, core.ScriptKindTS)
	start := strings.Index(source, "debugger")
	first := file.GetPositionMap().UTF8ToUTF16(start)
	set := &fileRuleSet{severities: map[string]string{"local/example": "error"}}
	reports, err := externalDiagnostics(file, set, []linthost.Message{{
		RuleID: "local/example", Severity: 2, Message: "remove debugger",
		Start: first, End: first + len("debugger"),
		Fix: &linthost.Fix{Range: [2]int{first, first + len("debugger;")}, Text: ""},
	}})
	assert.NilError(t, err)
	assert.Equal(t, len(reports), 1)
	assert.Equal(t, reports[0].Source(), "")
	assert.Equal(t, reports[0].LintRuleName(), "local/example")
	assert.Equal(t, reports[0].Pos(), start)
	assert.Equal(t, reports[0].CodeFixes()[0].Changes[0].TextChanges[0].Pos(), start)
	assert.Equal(t, reports[0].CodeFixes()[0].Changes[0].TextChanges[0].End(), len(source))
	for _, invalid := range [][2]int{{-1, 0}, {0, 1000}, {first + 1, first}} {
		_, rangeErr := lintRange(file, invalid[0], invalid[1])
		assert.Assert(t, rangeErr != nil)
	}
	emoji := file.GetPositionMap().UTF8ToUTF16(strings.Index(source, "\U0001F600"))
	_, err = lintRange(file, emoji+1, emoji+1)
	assert.Assert(t, err != nil)
}

func TestLintMixedDirectiveUsage(t *testing.T) {
	t.Parallel()
	file := parser.ParseSourceFile(ast.SourceFileParseOptions{FileName: "/input.ts", PathKey: "/input.ts"},
		"// eslint-disable-next-line no-debugger, local/example\ndebugger;", core.ScriptKindTS)
	directives, errors := parseDirectives(file, map[string]bool{"local/example": true})
	assert.Equal(t, len(errors), 0)
	location := core.NewTextRange(strings.Index(file.Text(), "debugger;"), len(file.Text()))
	assert.Assert(t, isSuppressed(file, directives, "no-debugger", location))
	assert.Equal(t, len(unusedDirectiveDiagnostics(file, directives, "warning")), 1)
	assert.Assert(t, isSuppressed(file, directives, "local/example", location))
	assert.Equal(t, len(unusedDirectiveDiagnostics(file, directives, "warning")), 0)
}

func TestLintGlobalIgnoreNegation(t *testing.T) {
	t.Parallel()
	patterns, err := compileLintPatterns([]string{"/project/**/src/vs/*/**/*.d.ts", "!/project/**/.eslint-plugin-local/**/*"}, make(map[string]lintPattern))
	assert.NilError(t, err)
	assert.Assert(t, matchesLintPatterns(patterns, "/project/src/vs/base/common/marked/marked.d.ts", true))
	assert.Assert(t, !matchesLintPatterns(patterns, "/project/src/vs/base/common/marked/marked.ts", true))
}

func TestPluginBatchesPreserveConfigurationOrder(t *testing.T) {
	t.Parallel()
	first := &fileRuleSet{custom: map[string]any{"local/first": 2}}
	second := &fileRuleSet{custom: map[string]any{"local/second": 2}}
	states := make([]fileState, 12)
	for index := range states {
		set := first
		if index%2 != 0 {
			set = second
		}

		states[index] = fileState{
			file:  parser.ParseSourceFile(ast.SourceFileParseOptions{FileName: "/input.ts", PathKey: "/input.ts"}, "debugger;", core.ScriptKindTS),
			rules: set,
		}
	}
	for range 20 {
		batches := pluginBatches(states, 1)
		assert.Equal(t, len(batches), 4)
		assert.Equal(t, batches[0].states[0], &states[0])
		assert.Equal(t, batches[1].states[0], &states[1])
		assert.Equal(t, batches[2].states[0], &states[6])
		assert.Equal(t, batches[3].states[0], &states[7])
	}
}

type failingFileHost struct{}

func (*failingFileHost) InspectPlugins(context.Context, linthost.PluginOptions) ([]string, error) {
	return []string{"local/example"}, nil
}

func (*failingFileHost) LintBatch(_ context.Context, _ *compiler.Program, _ linthost.PluginOptions, _ map[string]any, files []*ast.SourceFile) (*linthost.BatchResult, error) {
	if strings.Contains(files[0].FileName().AsString(), "transport") {
		return nil, errors.New("worker exited")
	}
	result := &linthost.BatchResult{}
	for _, file := range files {
		entry := linthost.FileResult{FileName: file.FileName().AsString()}
		if strings.Contains(entry.FileName, "bad") {
			entry.Error = "local/example: rule threw"
		} else {
			entry.Messages = []linthost.Message{
				{RuleID: "local/example", Severity: 2, Message: "invalid range", Start: -1},
				{RuleID: "local/example", Severity: 2, Message: "valid report", Start: 0, End: 8},
			}
		}
		result.Files = append(result.Files, entry)
	}
	return result, nil
}

func (*failingFileHost) Workers() int { return 2 }
func (*failingFileHost) Close() error { return nil }

func TestLintPluginFailuresPreserveOtherFilesAndReports(t *testing.T) {
	t.Parallel()
	fs := bundled.WrapFS(vfstest.FromMap(map[string]string{
		"/project/bad.ts":       "debugger;",
		"/project/good.ts":      "debugger;",
		"/project/transport.ts": "debugger;",
		"/project/tsconfig.json": `{
			"files":["transport.ts","bad.ts","good.ts"],
			"lint":{"plugins":{"local":"./rules.mjs"},"rules":{"local/example":"error"}}
		}`,
	}, tspath.CaseSensitive))
	config, errors := tsoptions.GetParsedCommandLineOfConfigFile("/project/tsconfig.json", &core.CompilerOptions{LintOnly: core.TSTrue, RunExternalCode: core.TSTrue}, nil, tsoptions.NewDefaultParseConfigHost(fs), nil)
	assert.Equal(t, len(errors), 0)
	assert.Equal(t, len(config.Errors), 0)
	program := compiler.NewProgram(compiler.ProgramOptions{Config: config, Host: compiler.NewCompilerHost(fs, bundled.LibPath(), nil, nil, nil)})
	reports := GetDiagnostics(WithHost(t.Context(), &failingFileHost{}), program)
	assert.Equal(t, len(reports), 4)
	var valid int
	for _, report := range reports {
		assert.Assert(t, report.File() != nil)
		if report.LintRuleName() == "local/example" {
			valid++
			assert.Equal(t, report.File().FileName(), tspath.RootedFilePath("/project/good.ts"))
		}
	}
	assert.Equal(t, valid, 1)
}

type warmingLintHost struct {
	count atomic.Int32
	err   error
}

func (*warmingLintHost) InspectPlugins(context.Context, linthost.PluginOptions) ([]string, error) {
	return []string{"local/example"}, nil
}

func (h *warmingLintHost) Warmup(_ context.Context, _ linthost.PluginOptions, count int) error {
	h.count.Store(int32(count))
	return h.err
}

func (*warmingLintHost) LintBatch(_ context.Context, _ *compiler.Program, _ linthost.PluginOptions, _ map[string]any, files []*ast.SourceFile) (*linthost.BatchResult, error) {
	result := &linthost.BatchResult{}
	for _, file := range files {
		result.Files = append(result.Files, linthost.FileResult{FileName: file.FileName().AsString()})
	}
	return result, nil
}

func (*warmingLintHost) Workers() int { return 8 }
func (*warmingLintHost) Close() error { return nil }

func TestLintPluginWarmupPreservesNativeReports(t *testing.T) {
	t.Parallel()
	fs := bundled.WrapFS(vfstest.FromMap(map[string]string{
		"/project/first.ts": "debugger;",
		"/project/other.ts": "debugger;",
		"/project/off.ts":   "debugger;",
		"/project/skip.ts":  "debugger;",
		"/project/tsconfig.json": `{
			"files":["first.ts","other.ts","off.ts","skip.ts"],
			"lint":{
				"plugins":{"local":"./rules.mjs"},
				"rules":{"no-debugger":"error","local/example":"error"},
				"ignores":["./skip.ts"],
				"overrides":[{"files":["./off.ts"],"rules":{"local/example":"off"}}]
			}
		}`,
	}, tspath.CaseSensitive))
	config, parseErrors := tsoptions.GetParsedCommandLineOfConfigFile("/project/tsconfig.json", &core.CompilerOptions{LintOnly: core.TSTrue, RunExternalCode: core.TSTrue}, nil, tsoptions.NewDefaultParseConfigHost(fs), nil)
	assert.Equal(t, len(parseErrors), 0)
	assert.Equal(t, len(config.Errors), 0)
	program := compiler.NewProgram(compiler.ProgramOptions{Config: config, Host: compiler.NewCompilerHost(fs, bundled.LibPath(), nil, nil, nil)})
	host := &warmingLintHost{err: errors.New("worker warmup failed")}
	reports := GetDiagnostics(WithHost(t.Context(), host), program)
	assert.Equal(t, host.count.Load(), int32(2))
	assert.Equal(t, len(reports), 4)
	var native, failures int
	for _, report := range reports {
		switch report.Code() {
		case diagnostics.Unexpected_debugger_statement.Code():
			native++
		case diagnostics.Lint_plugin_failed_Colon_0.Code():
			failures++
			assert.Equal(t, report.MessageArgs()[0], "worker warmup failed")
		}
	}
	assert.Equal(t, native, 3)
	assert.Equal(t, failures, 1)
}
