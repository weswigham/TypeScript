package codefix_test

import (
	"testing"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/codefix"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/locale"
	"gotest.tools/v3/assert"
)

func TestCreateCodeFixActionLocalization(t *testing.T) {
	t.Parallel()
	german, ok := locale.Parse("de-DE")
	assert.Assert(t, ok)
	description := ast.NewCompilerDiagnostic(diagnostics.Remove_unused_declaration_for_Colon_0, "unused")
	fixAllDescription := ast.NewCompilerDiagnostic(diagnostics.Remove_unused_declarations_for_Colon_0, "unused")

	action := codefix.CreateCodeFixAction("remove-unused", nil, description, "remove-all-unused", fixAllDescription)
	assert.Equal(t, action.Description, description)
	assert.Equal(t, action.FixAllDescription, fixAllDescription)
	assert.Equal(t, action.Description.Localize(german), `Nicht verwendete Deklaration für "unused" entfernen`)
	assert.Equal(t, action.FixAllDescription.Localize(german), `Nicht verwendete Deklarationen für "unused" entfernen`)
	assert.Equal(t, action.Description.Localize(locale.Default), "Remove unused declaration for: 'unused'")
	assert.Equal(t, action.FixAllDescription.Localize(locale.Default), "Remove unused declarations for: 'unused'")
	assert.Equal(t, action.Description.Localize(german), `Nicht verwendete Deklaration für "unused" entfernen`)
	assert.Equal(t, action.FixName, "remove-unused")
	assert.Equal(t, action.FixID, "remove-all-unused")

	withoutFixAll := codefix.CreateCodeFixAction("remove-unused", nil, description, "", nil)
	assert.Equal(t, withoutFixAll.FixAllDescription, (*ast.Diagnostic)(nil))
	assert.Equal(t, description.MessageArgs()[0], "unused")
}
