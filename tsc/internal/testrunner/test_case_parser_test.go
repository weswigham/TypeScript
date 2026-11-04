package testrunner

import (
	"testing"

	"github.com/google/go-cmp/cmp"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/testutil/harnessutil"
	"gotest.tools/v3/assert"
)

func TestMakeUnitsFromTest(t *testing.T) {
	t.Parallel()
	code := `// @strict: true
// @noEmit: true
// @filename: firstFile.ts
function foo() { return "a"; }
// normal comment
// @filename: secondFile.ts
// some other comment
function bar() { return "b"; }`
	testUnit1 := &testUnit{
		content: `function foo() { return "a"; }
// normal comment`,
		name: "firstFile.ts",
	}
	testUnit2 := &testUnit{
		content: `// some other comment
function bar() { return "b"; }`,
		name: "secondFile.ts",
	}
	testContent := testCaseContent{
		testUnitData:         []*testUnit{testUnit1, testUnit2},
		tsConfig:             nil,
		tsConfigFileUnitData: nil,
		symlinks:             make(map[string]string),
	}
	assert.DeepEqual(
		t,
		makeUnitsFromTest(code, "simpleTest.ts"),
		testContent,
		cmp.AllowUnexported(testCaseContent{}, testUnit{}),
	)
}

func TestFormattingDirectivesPreserveSourceAnnotations(t *testing.T) {
	t.Parallel()
	settings := extractCompilerSettings(`// @formatOnly: true
// @formatDiagnostics: true
// @ts-ignore: expected error
// @ts-expect-error: expected error
// @box-extension: .tsx
`)
	assert.Equal(t, settings["formatonly"], "true")
	assert.Equal(t, settings["formatdiagnostics"], "true")
	for _, annotation := range []string{"ts-ignore", "ts-expect-error", "box-extension"} {
		_, ok := settings[annotation]
		assert.Assert(t, !ok)
	}
}

func TestLintOnlyCompilerHarness(t *testing.T) {
	t.Parallel()
	for _, fix := range []string{"false", "true"} {
		t.Run(fix, func(t *testing.T) {
			t.Parallel()
			const code = `// @filename: tsconfig.json
{"lint":{"rules":{"no-debugger":"error"}},"files":["input.ts"]}
// @filename: input.ts
debugger;`
			payload := makeUnitsFromTest(code, "noDebuggerHarness.ts")
			config := &harnessutil.NamedTestConfiguration{Config: harnessutil.TestConfiguration{"lintonly": "true", "fix": fix}}
			result := newCompilerTest(t, "noDebuggerHarness.ts", "noDebuggerHarness.ts", &payload, config)
			assert.Assert(t, result.result.Result.EmitSkipped)
			assert.Equal(t, result.result.JS.Size(), 0)
			assert.Equal(t, result.result.DTS.Size(), 0)
			assert.Equal(t, len(result.result.Diagnostics), 1)
			assert.Equal(t, result.result.Diagnostics[0].Code(), diagnostics.Unexpected_debugger_statement.Code())
			assert.Equal(t, result.toBeCompiled[0].Content, "debugger;")
			if fix == "true" {
				assert.Equal(t, len(result.result.Fixed), 1)
				assert.Equal(t, result.result.Fixed[0].Content, ";")
			} else {
				assert.Equal(t, len(result.result.Fixed), 0)
			}
		})
	}
}
