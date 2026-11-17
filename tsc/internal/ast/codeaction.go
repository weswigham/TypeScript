package ast

import "github.com/microsoft/TypeScript/tsc/internal/core"

type CodeAction struct {
	Description *Diagnostic
	Changes     []core.FileTextChanges
	Commands    []core.CodeActionCommand
}

type CodeFixAction struct {
	CodeAction
	FixName           string
	FixID             string
	FixAllDescription *Diagnostic
}
