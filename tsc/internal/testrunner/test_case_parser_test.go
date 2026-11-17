package testrunner

import (
	"strings"
	"testing"

	"github.com/google/go-cmp/cmp"
	"github.com/microsoft/TypeScript/tsc/internal/core"
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

func TestPreserveFileContentRoundTrip(t *testing.T) {
	t.Parallel()
	for _, test := range []struct {
		name    string
		sources []string
	}{
		{"leading LF", []string{"\nlet x = 1;"}},
		{"multiple leading LFs", []string{"\n\nlet x = 1;"}},
		{"internal CRLF and CR", []string{"let x = 1;\r\nlet y = 2;\rlet z = 3;"}},
		{"EOF without newline", []string{"let x = 1;"}},
		{"EOF with LF", []string{"let x = 1;\n"}},
		{"EOF with CRLF", []string{"let x = 1;\r\n"}},
		{"empty source", []string{""}},
		{"only newlines", []string{"\n\n"}},
		{"file boundary without newline", []string{"let x = 1;", "\nlet y = 2;\n"}},
		{"file boundary with CR", []string{"let x = 1;\r", "\n\nlet y = 2;"}},
		{"file boundary with LF", []string{"let x = 1;\n", "\r\nlet y = 2;\r\n"}},
		{"file boundary with CRLF", []string{"\nlet x = 1;\r\n", "let y = 2;\r"}},
		{"empty auxiliary file", []string{"", "\nlet y = 2;"}},
		{"newline auxiliary file", []string{"\n", "let y = 2;"}},
	} {
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()
			names := []string{"auxiliary.ts", "main.ts"}
			var fixture strings.Builder
			fixture.WriteString("// @preserveFileContent: true\n")
			for index, source := range test.sources {
				if index != 0 {
					fixture.WriteByte('\n')
				}
				fixture.WriteString("// @filename: " + names[index] + "\n")
				fixture.WriteString(source)
			}
			result := makeUnitsFromTest(fixture.String(), "roundTrip.ts")
			assert.Equal(t, len(result.testUnitData), len(test.sources))
			for index, source := range test.sources {
				assert.Equal(t, result.testUnitData[index].name, names[index])
				assert.Equal(t, result.testUnitData[index].content, source)
			}
		})
	}
}

func TestPreserveFileContentDefaults(t *testing.T) {
	t.Parallel()
	for _, directive := range []string{"", "// @preserveFileContent: false\n"} {
		t.Run(directive, func(t *testing.T) {
			t.Parallel()
			result := makeUnitsFromTest(directive+"// @filename: input.ts\n\n\nlet x = 1;\r\nlet y = 2;\r", "normalized.ts")
			assert.Equal(t, result.testUnitData[0].content, "let x = 1;\nlet y = 2;\r")
		})
	}
}

func TestPreserveFileContentParserOptions(t *testing.T) {
	t.Parallel()
	parse := func(name, content string, _ map[string]string) (*testUnit, error) {
		return &testUnit{name: name, content: content}, nil
	}
	const source = "// @filename: input.ts\n\nlet x = 1;\r\n"
	units, _, _, _, err := ParseTestFilesAndSymlinksWithOptions(source, "options.ts", parse, ParseTestFilesOptions{PreserveFileContent: true})
	assert.NilError(t, err)
	assert.Equal(t, units[0].content, "\nlet x = 1;\r\n")

	units, _, _, _, err = ParseTestFilesAndSymlinksWithOptions(
		"// @preserveFileContent: true\n"+source, "options.ts", parse, ParseTestFilesOptions{AllowImplicitFirstFile: true})
	assert.NilError(t, err)
	assert.Equal(t, units[0].content, "\nlet x = 1;\n")
}

func TestPreserveFileContentHarnessOption(t *testing.T) {
	t.Parallel()
	var options core.CompilerOptions
	var harnessOptions harnessutil.HarnessOptions
	for _, setting := range []string{"true", "false"} {
		harnessutil.SetOptionsFromTestConfig(t, harnessutil.TestConfiguration{"preservefilecontent": setting},
			&options, &harnessOptions, srcFolder, false /*allowUnknownOptions*/)
		assert.Equal(t, harnessOptions.PreserveFileContent, setting == "true")
	}
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

func TestLintCompilerHarnessDiagnostics(t *testing.T) {
	t.Parallel()
	for _, option := range []string{"lint", "lintonly"} {
		t.Run(option, func(t *testing.T) {
			t.Parallel()
			const code = `// @filename: tsconfig.json
{"lint":{"rules":{"no-debugger":"error"}},"files":["input.ts"]}
// @filename: input.ts
debugger; missing;`
			payload := makeUnitsFromTest(code, "lintDiagnostics.ts")
			config := &harnessutil.NamedTestConfiguration{Config: harnessutil.TestConfiguration{option: "true"}}
			result := newCompilerTest(t, "lintDiagnostics.ts", "lintDiagnostics.ts", &payload, config).result
			assert.Equal(t, len(result.Diagnostics), 2)
			report := result.Diagnostics[0]
			assert.Equal(t, report.Code(), diagnostics.Unexpected_debugger_statement.Code())
			assert.Equal(t, result.Diagnostics[1].Code(), diagnostics.Cannot_find_name_0.Code())
			assert.Equal(t, report.File(), result.Program.GetSourceFile(report.File().FileName()))
			assert.Equal(t, report.Pos(), 0)
			assert.Equal(t, report.Len(), len("debugger;"))
		})
	}
}
