package core

import "github.com/microsoft/TypeScript/tsc/internal/tspath"

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

type CombinedCodeActions struct {
	Changes  []FileTextChanges
	Commands []CodeActionCommand
}
