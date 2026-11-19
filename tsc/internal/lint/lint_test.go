package lint

import (
	"slices"
	"strconv"
	"strings"
	"testing"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/bundled"
	"github.com/microsoft/TypeScript/tsc/internal/compiler"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
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
	recorders := []*recordingRule{all, pruned, rejected}
	for range 130 {
		recorders = append(recorders, &recordingRule{t: t})
	}
	visitors := make([]rules.Rule, 0, len(recorders))
	for _, rule := range recorders {
		visitors = append(visitors, rules.Rule{Enter: rule.OnEnterNode, Exit: rule.OnExitNode})
	}
	Walk(file.AsNode(), visitors)
	assert.Equal(t, len(rejected.entered), 0)
	assert.Equal(t, len(rejected.exited), 0)
	for _, rule := range recorders {
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

func TestLintSubscribedTraversal(t *testing.T) {
	t.Parallel()
	type event struct {
		rule  int
		node  *ast.Node
		enter bool
	}
	file := parser.ParseSourceFile(ast.SourceFileParseOptions{FileName: "/input.ts", PathKey: "/input.ts"}, "function skip() { debugger; } debugger;", core.ScriptKindTS)
	for _, count := range []int{1, 61, 64, 65, 132, 326} {
		t.Run(strconv.Itoa(count), func(t *testing.T) {
			t.Parallel()
			var actual, expected []event
			construct := func(events *[]event) []rules.Rule {
				var visitors []rules.Rule
				for index := 1; index <= count; index++ {
					visitor := rules.Rule{
						Enter: func(node *ast.Node) bool {
							*events = append(*events, event{index, node, true})
							return node.Kind != ast.KindFunctionDeclaration || index%2 == 0
						},
						Exit: func(node *ast.Node) {
							*events = append(*events, event{index, node, false})
						},
					}
					if index%3 != 0 {
						switch index % 4 {
						case 0:
							visitor.Enter = nil
							visitor.ExitKinds = []ast.Kind{ast.KindDebuggerStatement}
						case 1:
							visitor.EnterKinds = []ast.Kind{ast.KindSourceFile, ast.KindFunctionDeclaration, ast.KindDebuggerStatement, ast.KindDebuggerStatement}
							visitor.ExitKinds = []ast.Kind{ast.KindSourceFile, ast.KindFunctionDeclaration, ast.KindDebuggerStatement}
						case 2:
							visitor.EnterKinds = []ast.Kind{ast.KindIdentifier}
							visitor.ExitKinds = []ast.Kind{ast.KindFunctionDeclaration}
						case 3:
							visitor.EnterKinds = []ast.Kind{}
							visitor.Exit = nil
						}
					}
					visitors = append(visitors, visitor)
				}
				return visitors
			}
			visitors := construct(&actual)
			reference := construct(&expected)
			var visit func(*ast.Node, []rules.Rule)
			visit = func(node *ast.Node, active []rules.Rule) {
				var entered []rules.Rule
				for _, visitor := range active {
					if visitor.Enter == nil || visitor.EnterKinds != nil && !slices.Contains(visitor.EnterKinds, node.Kind) || visitor.Enter(node) {
						entered = append(entered, visitor)
					}
				}
				if len(entered) != 0 {
					node.ForEachChild(func(child *ast.Node) bool { visit(child, entered); return false })
					for _, visitor := range entered {
						if visitor.Exit != nil && (visitor.ExitKinds == nil || slices.Contains(visitor.ExitKinds, node.Kind)) {
							visitor.Exit(node)
						}
					}
				}
			}
			visit(file.AsNode(), reference)
			Walk(file.AsNode(), visitors)
			assert.Assert(t, slices.Equal(actual, expected), "callback trace differs: actual %v; expected %v", actual, expected)
		})
	}
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

func TestLintMultiRuleDirectiveActions(t *testing.T) {
	t.Parallel()
	const source = `/* eslint-disable no-debugger */
debugger;
async function run() { await 0; }
/* eslint-enable no-debugger */
debugger;`
	reports := lintTestDiagnostics(t, "input.ts", source, `"no-debugger":"error","@typescript-eslint/await-thenable":"error"`)
	assert.Equal(t, len(reports), 2)
	assert.Equal(t, reports[0].Code(), diagnostics.Unexpected_await_of_a_non_Promise_non_Thenable_value.Code())
	assert.Equal(t, len(reports[0].CodeFixSuggestions()), 1)
	assert.Equal(t, reports[1].Code(), diagnostics.Unexpected_debugger_statement.Code())
	assert.Equal(t, len(reports[1].CodeFixes()), 1)
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
	return GetDiagnostics(t.Context(), lintTestProgram(t, filename, source, settings))
}

func lintTestProgram(t testing.TB, filename, source, settings string) *compiler.Program {
	t.Helper()
	fs := bundled.WrapFS(vfstest.FromMap(map[string]string{
		"/project/" + filename:   source,
		"/project/tsconfig.json": `{"compilerOptions":{"target":"esnext","strict":true,"jsx":"preserve"},"files":["` + filename + `"],"lint":{"rules":{` + settings + `}}}`,
	}, tspath.CaseSensitive))
	config, errors := tsoptions.GetParsedCommandLineOfConfigFile("/project/tsconfig.json", &core.CompilerOptions{LintOnly: core.TSTrue}, nil, tsoptions.NewDefaultParseConfigHost(fs), nil)
	assert.Equal(t, len(errors), 0)
	assert.Equal(t, len(config.Errors), 0)
	return compiler.NewProgram(compiler.ProgramOptions{
		Config: config,
		Host:   compiler.NewCompilerHost(fs, bundled.LibPath(), nil, nil, nil),
	})
}

func BenchmarkLintDiagnostics(b *testing.B) {
	names := []string{
		"no-compare-neg-zero", "no-debugger", "no-alert", "no-array-constructor",
		"no-async-promise-executor", "no-await-in-loop", "no-bitwise", "no-caller",
		"no-case-declarations", "no-class-assign", "no-cond-assign", "no-console",
		"no-const-assign", "no-continue", "no-delete-var", "no-dupe-args",
		"no-dupe-class-members", "no-dupe-else-if", "no-dupe-keys", "no-duplicate-case",
		"no-empty", "no-empty-character-class", "no-empty-function", "no-empty-pattern",
		"no-empty-static-block", "no-eval", "no-ex-assign", "no-extra-bind",
		"no-extra-boolean-cast", "no-extra-label", "no-func-assign", "no-nested-ternary",
	}
	for _, count := range []int{1, len(names)} {
		b.Run(strconv.Itoa(count)+"_rules", func(b *testing.B) {
			for _, directives := range []bool{false, true} {
				b.Run("directives="+strconv.FormatBool(directives), func(b *testing.B) {
					const reports = 2000
					source := strings.Repeat("0 === -0;\n", reports)
					if directives {
						source = "/* eslint-disable no-console */\n" + source
					}
					settings := `"` + strings.Join(names[:count], `":"error","`) + `":"error"`
					program := lintTestProgram(b, "input.ts", source, settings)
					assert.Equal(b, len(GetDiagnostics(b.Context(), program)), reports)
					b.ReportAllocs()
					b.SetBytes(int64(len(source)))
					for b.Loop() {
						assert.Equal(b, len(GetDiagnostics(b.Context(), program)), reports)
					}
				})
			}
		})
	}
}
