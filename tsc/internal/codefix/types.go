package codefix

import (
	"cmp"
	"slices"

	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/tspath"
)

type TextChange = core.TextChange

type FileTextChanges struct {
	FileName    tspath.RootedFilePath
	TextChanges []TextChange
	IsNewFile   bool
}

type CodeActionCommand struct {
	Type        string
	File        tspath.RootedFilePath
	PackageName string
}

type CodeAction struct {
	Description string
	Changes     []FileTextChanges
	Commands    []CodeActionCommand
}

type CodeFixAction struct {
	CodeAction
	FixName           string
	FixID             string
	FixAllDescription string
}

type CombinedCodeActions struct {
	Changes  []FileTextChanges
	Commands []CodeActionCommand
}

func CreateCodeFixAction(fixName string, changes []FileTextChanges, description, fixID, fixAllDescription string) *CodeFixAction {
	action := CodeAction{Description: description, Changes: changes}
	return &CodeFixAction{
		CodeAction:        action,
		FixName:           fixName,
		FixID:             fixID,
		FixAllDescription: fixAllDescription,
	}
}

func CombineCodeFixes(actions []*CodeFixAction) *CombinedCodeActions {
	files := make(map[tspath.RootedFilePath]FileTextChanges)
	for _, action := range actions {
		if action == nil || len(action.Commands) != 0 {
			continue
		}
		pending := make(map[tspath.RootedFilePath]FileTextChanges)
		conflict := false
		for _, file := range action.Changes {
			changes := pending[file.FileName]
			changes.FileName = file.FileName
			changes.IsNewFile = file.IsNewFile
			for _, edit := range file.TextChanges {
				duplicate := false
				for _, existing := range slices.Concat(files[file.FileName].TextChanges, changes.TextChanges) {
					if edit == existing {
						duplicate = true
						break
					}
					if edit.Pos() == existing.Pos() || edit.Pos() < existing.End() && existing.Pos() < edit.End() {
						conflict = true
					}
				}
				if !duplicate {
					changes.TextChanges = append(changes.TextChanges, edit)
				}
			}
			pending[file.FileName] = changes
		}
		if conflict {
			continue
		}
		for name, changes := range pending {
			changes.TextChanges = append(slices.Clone(files[name].TextChanges), changes.TextChanges...)
			files[name] = changes
		}
	}
	result := &CombinedCodeActions{}
	for _, file := range files {
		if len(file.TextChanges) == 0 {
			continue
		}
		slices.SortFunc(file.TextChanges, func(left, right TextChange) int {
			return cmp.Or(cmp.Compare(left.Pos(), right.Pos()), cmp.Compare(left.End(), right.End()))
		})
		result.Changes = append(result.Changes, file)
	}
	slices.SortFunc(result.Changes, func(left, right FileTextChanges) int { return left.FileName.Compare(right.FileName) })
	return result
}
