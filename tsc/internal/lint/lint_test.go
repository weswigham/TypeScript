package lint

import (
	"testing"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/bundled"
	"github.com/microsoft/TypeScript/tsc/internal/compiler"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules"
	"github.com/microsoft/TypeScript/tsc/internal/parser"
	"github.com/microsoft/TypeScript/tsc/internal/tsoptions"
	"github.com/microsoft/TypeScript/tsc/internal/tspath"
	"github.com/microsoft/TypeScript/tsc/internal/vfs/vfstest"
	"gotest.tools/v3/assert"
)

type recordingRule struct {
	t       *testing.T
	prune   ast.Kind
	entered []*ast.Node
	exited  []*ast.Node
	stack   []*ast.Node
}

func (rule *recordingRule) OnEnterNode(node *ast.Node) bool {
	if node.Kind == rule.prune {
		return false
	}
	rule.entered = append(rule.entered, node)
	rule.stack = append(rule.stack, node)
	return true
}

func (rule *recordingRule) OnExitNode(node *ast.Node) {
	assert.Assert(rule.t, len(rule.stack) > 0)
	assert.Equal(rule.t, rule.stack[len(rule.stack)-1], node)
	rule.stack = rule.stack[:len(rule.stack)-1]
	rule.exited = append(rule.exited, node)
}

func TestLintTraversal(t *testing.T) {
	t.Parallel()
	file := parser.ParseSourceFile(ast.SourceFileParseOptions{FileName: "/input.ts", PathKey: "/input.ts"}, "function f() { debugger; } debugger;", core.ScriptKindTS)
	all := &recordingRule{t: t}
	pruned := &recordingRule{t: t, prune: ast.KindFunctionDeclaration}
	rejected := &recordingRule{t: t, prune: ast.KindSourceFile}
	visitors := []rules.Rule{all, pruned, rejected}
	for range 130 {
		visitors = append(visitors, &recordingRule{t: t})
	}
	Walk(file.AsNode(), visitors)
	assert.Equal(t, len(rejected.entered), 0)
	assert.Equal(t, len(rejected.exited), 0)
	for _, visitor := range visitors {
		rule := visitor.(*recordingRule)
		assert.Equal(t, len(rule.entered), len(rule.exited))
		assert.Equal(t, len(rule.stack), 0)
	}
	countDebuggers := func(rule *recordingRule) int {
		count := 0
		for _, node := range rule.entered {
			if node.Kind == ast.KindDebuggerStatement {
				count++
			}
		}
		return count
	}
	assert.Equal(t, countDebuggers(all), 2)
	assert.Equal(t, countDebuggers(pruned), 1)
	assert.Equal(t, all.exited[len(all.exited)-1], file.AsNode())
}

func TestLintDirectives(t *testing.T) {
	t.Parallel()
	for _, test := range []struct {
		name, source string
		count        int
	}{
		{"next line", "// eslint-disable-next-line no-debugger\ndebugger;", 0},
		{"same line", "debugger; // eslint-disable-line no-debugger", 0},
		{"all rules", "/* eslint-disable */ debugger;", 0},
		{"enable rule", "/* eslint-disable */ debugger; /* eslint-enable no-debugger */ debugger;", 1},
		{"enable all", "/* eslint-disable no-debugger */ debugger; /* eslint-enable */ debugger;", 1},
		{"other rule", "// eslint-disable-next-line no-console\ndebugger;", 1},
		{"reason", "// eslint-disable-next-line no-debugger -- intentional\ndebugger;", 0},
		{"tab separator", "// eslint-disable-next-line\tno-debugger\ndebugger;", 0},
		{"quoted rule", "/* eslint-disable \"no-debugger\" */ debugger;", 0},
		{"trailing comma", "/* eslint-disable no-debugger, */ debugger;", 0},
		{"empty list", "/* eslint-disable , */ debugger;", 0},
		{"CR line break", "// eslint-disable-next-line no-debugger\rdebugger;", 0},
		{"Unicode line break", "// eslint-disable-next-line no-debugger\u2028debugger;", 0},
		{"multiline next line", "/* eslint-disable-next-line\n no-debugger */\ndebugger;", 0},
		{"string", "const value = '/* eslint-disable */'; debugger;", 1},
		{"regex", "const value = /[/* eslint-disable */]/; debugger;", 1},
		{"template", "const value = `/* eslint-disable */`; debugger;", 1},
		{"template expression", "const value = `${(() => { /* eslint-disable no-debugger */ debugger; })()}`;", 0},
		{"JSX text", "const value = <div>/* eslint-disable */</div>; debugger;", 1},
		{"trailing directive", "debugger;\n// eslint-disable-next-line no-debugger", 1},
	} {
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()
			reports := lintTestDiagnostics(t, "input.tsx", test.source, `"no-debugger":"error"`)
			assert.Equal(t, len(reports), test.count)
		})
	}
}

func TestLintDeclarationInputs(t *testing.T) {
	t.Parallel()
	reports := lintTestDiagnostics(t, "input.d.ts", "export declare const value: any;", `"@typescript-eslint/no-explicit-any":"error"`)
	assert.Equal(t, len(reports), 1)
}

func TestLintRestrictedImportDirective(t *testing.T) {
	t.Parallel()
	const source = `import {
	AllowedObject,
	DisallowedObject, // eslint-disable-line
} from "foo";`
	reports := lintTestDiagnostics(t, "input.ts", source, `"no-restricted-imports":["error",{"paths":[{"name":"foo","importNames":["DisallowedObject"]}]}]`)
	assert.Equal(t, len(reports), 0)
}

func TestLintDirectiveErrors(t *testing.T) {
	t.Parallel()
	for _, source := range []string{
		"// eslint-disable-next-line missing-rule\nexport {};",
		"/* eslint-disable-line\n no-debugger */\nexport {};",
	} {
		t.Run(source, func(t *testing.T) {
			t.Parallel()
			reports := lintTestDiagnostics(t, "input.ts", source, `"no-debugger":"error"`)
			assert.Equal(t, len(reports), 1)
			assert.Assert(t, reports[0].File() != nil)
		})
	}
}

func TestLintDisabledUnknownRule(t *testing.T) {
	t.Parallel()
	reports := lintTestDiagnostics(t, "input.ts", "export {};", `"missing-rule":"off"`)
	assert.Equal(t, len(reports), 0)
}

func TestLintInvalidRuleOptions(t *testing.T) {
	t.Parallel()
	for _, settings := range []string{
		`"no-debugger":["error",{"unsupported":true}]`,
		`"eqeqeq":["error","not-an-option"]`,
		`"no-console":["error",{"alow":["warn"]}]`,
	} {
		t.Run(settings, func(t *testing.T) {
			t.Parallel()
			reports := lintTestDiagnostics(t, "input.ts", "export {};", settings)
			assert.Equal(t, len(reports), 1)
			assert.Assert(t, reports[0].File() == nil)
		})
	}
}

func TestLintJavaScriptRegexOptions(t *testing.T) {
	t.Parallel()
	for _, test := range []struct {
		name, source, settings string
		count                  int
	}{
		{"unused variables", "const ignored = 1; const other = 1; export {};", `"no-unused-vars":["error",{"varsIgnorePattern":"^ignored(?=$)"}]`, 1},
		{"TypeScript unused variables", "const ignored = 1; const other = 1; export {};", `"@typescript-eslint/no-unused-vars":["error",{"varsIgnorePattern":"^ignored(?=$)"}]`, 1},
		{"require imports", `require("allowed"); require("other");`, `"@typescript-eslint/no-require-imports":["error",{"allow":["^allowed(?=$)"]}]`, 1},
		{"inline comments", "const first = 1; // skip\nconst second = 2; // report", `"no-inline-comments":["error",{"ignorePattern":"(?<= )skip"}]`, 1},
		{"object methods", "const value = { ignored: function() {}, other: function() {} };", `"object-shorthand":["error","always",{"methodsIgnorePattern":"^ignored(?=$)"}]`, 1},
	} {
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()
			reports := lintTestDiagnostics(t, "input.ts", test.source, test.settings)
			assert.Equal(t, len(reports), test.count)
		})
	}
}

func lintTestDiagnostics(t *testing.T, filename, source, settings string) []*ast.Diagnostic {
	t.Helper()
	fs := bundled.WrapFS(vfstest.FromMap(map[string]string{
		"/project/" + filename:   source,
		"/project/tsconfig.json": `{"compilerOptions":{"target":"esnext","strict":true,"jsx":"preserve"},"files":["` + filename + `"],"lint":{"rules":{` + settings + `}}}`,
	}, tspath.CaseSensitive))
	config, errors := tsoptions.GetParsedCommandLineOfConfigFile("/project/tsconfig.json", &core.CompilerOptions{LintOnly: core.TSTrue}, nil, tsoptions.NewDefaultParseConfigHost(fs), nil)
	assert.Equal(t, len(errors), 0)
	assert.Equal(t, len(config.Errors), 0)
	program := compiler.NewProgram(compiler.ProgramOptions{
		Config: config,
		Host:   compiler.NewCompilerHost(fs, bundled.LibPath(), nil, nil, nil),
	})
	return GetDiagnostics(t.Context(), program)
}
