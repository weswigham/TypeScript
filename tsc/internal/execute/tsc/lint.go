package tsc

import (
	"slices"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/compiler"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/tspath"
	"github.com/microsoft/TypeScript/tsc/internal/vfs"
)

func ApplyLintFixes(fs vfs.FS, program *compiler.Program, items []*ast.Diagnostic) ([]tspath.RootedFilePath, []*ast.Diagnostic) {
	var actions []*codefix.CodeFixAction
	for _, item := range items {
		for _, action := range item.CodeFixes() {
			if len(action.Commands) != 0 {
				continue
			}
			mapped := *action
			mapped.Changes = nil
			valid := true
			for _, change := range action.Changes {
				file := program.GetSourceFile(change.FileName)
				if file == nil || change.IsNewFile {
					valid = false
					break
				}
				change.FileName = file.OriginalFileName()
				change.TextChanges = slices.Clone(change.TextChanges)
				if spans := file.SpanMap(); spans != nil {
					for index, edit := range change.TextChanges {
						location, fidelity := spans.VirtualToOriginalSpan(edit.TextRange)
						if !fidelity.IsExact() {
							valid = false
							break
						}
						change.TextChanges[index].TextRange = location
					}
				}
				mapped.Changes = append(mapped.Changes, change)
			}
			if valid {
				actions = append(actions, &mapped)
				break
			}
		}
	}
	var changed []tspath.RootedFilePath
	var errors []*ast.Diagnostic
	for _, change := range codefix.CombineCodeFixes(actions).Changes {
		text, ok := fs.ReadFile(change.FileName)
		if !ok {
			errors = append(errors, ast.NewCompilerDiagnostic(diagnostics.File_0_not_found, change.FileName))
			continue
		}
		valid := true
		for _, file := range program.GetSourceFiles() {
			if file.OriginalFileName() == change.FileName && text != file.OriginalText() {
				valid = false
				break
			}
		}
		for _, edit := range change.TextChanges {
			valid = valid && edit.Pos() >= 0 && edit.End() >= edit.Pos() && edit.End() <= len(text)
		}
		if !valid {
			errors = append(errors, ast.NewCompilerDiagnostic(diagnostics.Could_not_write_file_0_Colon_1, change.FileName, "The source text no longer matches the lint fix."))
			continue
		}
		fixed := core.ApplyBulkEdits(text, change.TextChanges)
		if fixed == text {
			continue
		}
		if err := fs.WriteFile(change.FileName, fixed); err != nil {
			errors = append(errors, ast.NewCompilerDiagnostic(diagnostics.Could_not_write_file_0_Colon_1, change.FileName, err.Error()))
			continue
		}
		changed = append(changed, change.FileName)
	}
	return changed, errors
}
