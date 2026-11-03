package fourslash_test

import (
	"testing"

	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/fourslash"
	"github.com/microsoft/TypeScript/tsc/internal/testutil"
)

func TestFormattingOptionsConfig(t *testing.T) {
	t.Parallel()
	for _, selection := range []bool{false, true} {
		name := "document"
		if selection {
			name = "selection"
		}
		t.Run(name, func(t *testing.T) {
			t.Parallel()
			defer testutil.RecoverAndFail(t, "Panic on fourslash test")
			const content = `
// @Filename: /base.json
{ "formattingOptions": { "indentSize": 2, "tabSize": 2 } }
// @Filename: /tsconfig.json
{ "extends": "./base.json", "formattingOptions": { "insertSpaceBeforeAndAfterBinaryOperators": false } }
// @Filename: /input.ts
/*start*/function value(input:number){
return input + 1;
}/*end*/
`
			f, done := fourslash.NewFourslash(t, nil, content)
			defer done()
			options := f.GetOptions()
			options.IndentSize = 8
			options.TabSize = 8
			options.InsertSpaceBeforeAndAfterBinaryOperators = core.TSTrue
			f.Configure(t, options)
			f.GoToFile(t, "/input.ts")
			if selection {
				f.FormatSelection(t, "start", "end")
			} else {
				f.FormatDocument(t, "")
			}
			f.VerifyCurrentFileContent(t, "function value(input: number) {\n  return input+1;\n}\n")
		})
	}
}
