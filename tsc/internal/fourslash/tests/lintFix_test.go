package fourslash_test

import (
	"testing"

	"github.com/microsoft/TypeScript/tsc/internal/fourslash"
	"github.com/microsoft/TypeScript/tsc/internal/testutil"
)

func TestLintCodeFix(t *testing.T) {
	t.Parallel()
	defer testutil.RecoverAndFail(t, "Panic on lint code fix test")
	const content = `// @Filename: /tsconfig.json
{"lint":{"rules":{"no-debugger":"error"}},"files":["input.ts"]}
// @Filename: /input.ts
if (true) [|/*fix*/debugger;/*end*/|] else console.log("ok");`
	f, done := fourslash.NewFourslash(t, nil, content)
	defer done()
	f.GoToMarker(t, "fix")
	f.VerifyCodeFixAvailable(t, []string{"Remove 'debugger' statement"})
	f.VerifyCodeFix(t, fourslash.VerifyCodeFixOptions{
		Description:    "Remove 'debugger' statement",
		NewFileContent: `if (true) ; else console.log("ok");`,
		ApplyChanges:   true,
	})
	f.VerifyErrorExistsBetweenMarkers(t, "fix", "end")
}

func TestLintFixAll(t *testing.T) {
	t.Parallel()
	for _, sourceAction := range []bool{false, true} {
		name := "quickfix"
		if sourceAction {
			name = "source.fixAll"
		}
		t.Run(name, func(t *testing.T) {
			t.Parallel()
			defer testutil.RecoverAndFail(t, "Panic on lint fix-all test")
			const content = `// @Filename: /tsconfig.json
{"lint":{"rules":{"no-debugger":"error"}},"files":["input.ts"]}
// @Filename: /input.ts
/*fix*/debugger;
while (false) debugger;
// retained comment
debugger;`
			f, done := fourslash.NewFourslash(t, nil, content)
			defer done()
			f.GoToMarker(t, "fix")
			const fixed = ";\nwhile (false) ;\n// retained comment\n;"
			if sourceAction {
				f.VerifySourceFixAll(t, fixed)
			} else {
				f.VerifyCodeFixAll(t, fourslash.VerifyCodeFixAllOptions{FixID: "no-debugger", NewFileContent: fixed})
			}
			f.VerifyNoErrors(t)
		})
	}
}

func TestLintDisabledInEditor(t *testing.T) {
	t.Parallel()
	const content = `// @Filename: /tsconfig.json
{"lint":{"rules":{"no-debugger":"off"}},"files":["input.ts"]}
// @Filename: /input.ts
/*fix*/debugger;`
	f, done := fourslash.NewFourslash(t, nil, content)
	defer done()
	f.GoToMarker(t, "fix")
	f.VerifyNoErrors(t)
	f.VerifyCodeFixNotAvailable(t)
}

func TestLintWarningDiagnostics(t *testing.T) {
	t.Parallel()
	const content = `// @Filename: /tsconfig.json
{"lint":{"rules":{"no-debugger":"warning"}},"files":["input.ts"]}
// @Filename: /input.ts
/*fix*/debugger;`
	f, done := fourslash.NewFourslash(t, nil, content)
	defer done()
	f.GoToMarker(t, "fix")
	f.VerifyBaselineNonSuggestionDiagnostics(t)
	f.VerifyCodeFixAvailable(t, []string{"Remove 'debugger' statement"})
}

func TestLintSuggestionCodeAction(t *testing.T) {
	t.Parallel()
	const content = `// @Filename: /tsconfig.json
{"compilerOptions":{"strict":true},"lint":{"rules":{"@typescript-eslint/no-non-null-assertion":"error"}},"files":["input.ts"]}
// @Filename: /input.ts
declare const value: { method(): void } | undefined;
value/*suggestion*/!.method();`
	f, done := fourslash.NewFourslash(t, nil, content)
	defer done()
	f.GoToMarker(t, "suggestion")
	f.VerifyCodeFix(t, fourslash.VerifyCodeFixOptions{
		Description:    "Consider using the optional chain operator `?.` instead. This operator includes runtime checks, so it is safer than the compile-only non-null assertion operator.",
		NewFileContent: "declare const value: { method(): void } | undefined;\nvalue?.method();",
		ApplyChanges:   true,
	})
	f.VerifyNoErrors(t)
}
