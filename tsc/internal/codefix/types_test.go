package codefix

import (
	"testing"

	"github.com/microsoft/TypeScript/tsc/internal/core"
	"gotest.tools/v3/assert"
)

func TestCombineCodeFixes(t *testing.T) {
	t.Parallel()
	first := CreateCodeFixAction("first", []FileTextChanges{{FileName: "/a.ts", TextChanges: []TextChange{{TextRange: core.NewTextRange(0, 3)}}}}, "First", "first", "All first")
	conflict := CreateCodeFixAction("conflict", []FileTextChanges{
		{FileName: "/b.ts", TextChanges: []TextChange{{TextRange: core.NewTextRange(0, 1)}}},
		{FileName: "/a.ts", TextChanges: []TextChange{{TextRange: core.NewTextRange(1, 4)}}},
	}, "Conflict", "", "")
	last := CreateCodeFixAction("last", []FileTextChanges{{FileName: "/a.ts", TextChanges: []TextChange{{TextRange: core.NewTextRange(3, 5), NewText: "end"}}}}, "Last", "", "")
	command := CreateCodeFixAction("command", []FileTextChanges{{FileName: "/c.ts", TextChanges: []TextChange{{TextRange: core.NewTextRange(0, 1)}}}}, "Command", "", "")
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
		actions = append(actions, CreateCodeFixAction(text, []FileTextChanges{{FileName: "/a.ts", TextChanges: []TextChange{{TextRange: core.NewTextRange(0, 0), NewText: text}}}}, text, "", ""))
	}
	combined := CombineCodeFixes(actions)
	assert.Equal(t, len(combined.Changes), 1)
	assert.Equal(t, len(combined.Changes[0].TextChanges), 1)
	assert.Equal(t, combined.Changes[0].TextChanges[0].NewText, "first")
}
