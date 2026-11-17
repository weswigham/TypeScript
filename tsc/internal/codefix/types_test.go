package codefix

import (
	"testing"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"gotest.tools/v3/assert"
)

func TestCombineCodeFixes(t *testing.T) {
	t.Parallel()
	first := CreateCodeFixAction("first", []FileTextChanges{{FileName: "/a.ts", TextChanges: []TextChange{{TextRange: core.NewTextRange(0, 3)}}}}, ast.NewCompilerDiagnostic(diagnostics.Remove_unused_label), "first", ast.NewCompilerDiagnostic(diagnostics.Remove_all_unused_labels))
	conflict := CreateCodeFixAction("conflict", []FileTextChanges{
		{FileName: "/b.ts", TextChanges: []TextChange{{TextRange: core.NewTextRange(0, 1)}}},
		{FileName: "/a.ts", TextChanges: []TextChange{{TextRange: core.NewTextRange(1, 4)}}},
	}, ast.NewCompilerDiagnostic(diagnostics.Remove_unused_label), "", nil)
	last := CreateCodeFixAction("last", []FileTextChanges{{FileName: "/a.ts", TextChanges: []TextChange{{TextRange: core.NewTextRange(3, 5), NewText: "end"}}}}, ast.NewCompilerDiagnostic(diagnostics.Remove_unused_label), "", nil)
	command := CreateCodeFixAction("command", []FileTextChanges{{FileName: "/c.ts", TextChanges: []TextChange{{TextRange: core.NewTextRange(0, 1)}}}}, ast.NewCompilerDiagnostic(diagnostics.Remove_unused_label), "", nil)
	command.Commands = []CodeActionCommand{{Type: "install package", PackageName: "package"}}
	combined := CombineCodeFixes([]*CodeFixAction{first, first, conflict, last, command})
	assert.Equal(t, len(combined.Changes), 1)
	assert.Equal(t, combined.Changes[0].FileName, first.Changes[0].FileName)
	assert.Equal(t, len(combined.Changes[0].TextChanges), 2)
	assert.Equal(t, core.ApplyBulkEdits("12345", combined.Changes[0].TextChanges), "end")
	assert.Equal(t, len(first.Changes[0].TextChanges), 1)
}

func TestCombineCodeFixInsertions(t *testing.T) {
	t.Parallel()
	var actions []*CodeFixAction
	for _, text := range []string{"first", "second", "first"} {
		actions = append(actions, CreateCodeFixAction(text, []FileTextChanges{{FileName: "/a.ts", TextChanges: []TextChange{{TextRange: core.NewTextRange(0, 0), NewText: text}}}}, ast.NewCompilerDiagnostic(diagnostics.Remove_unused_label), "", nil))
	}
	combined := CombineCodeFixes(actions)
	assert.Equal(t, len(combined.Changes), 1)
	assert.Equal(t, len(combined.Changes[0].TextChanges), 1)
	assert.Equal(t, combined.Changes[0].TextChanges[0].NewText, "first")
}
