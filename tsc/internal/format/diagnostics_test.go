package format_test

import (
	"slices"
	"strings"
	"testing"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/format"
	"github.com/microsoft/TypeScript/tsc/internal/locale"
	"github.com/microsoft/TypeScript/tsc/internal/ls/lsutil"
	"github.com/microsoft/TypeScript/tsc/internal/parser"
	"gotest.tools/v3/assert"
)

func TestFormattingRuleDiagnostics(t *testing.T) {
	t.Parallel()
	const text = "const value=1;"
	file := parser.ParseSourceFile(ast.SourceFileParseOptions{FileName: "/input.ts", PathKey: "/input.ts"}, text, core.ScriptKindTS)
	ctx := format.WithFormatCodeSettings(t.Context(), lsutil.GetDefaultFormatCodeSettings(), "\n")
	edits, diagnostics, err := format.FormatRangesWithDiagnostics(ctx, file, nil)
	assert.NilError(t, err)
	assert.Equal(t, len(edits), 2)
	assert.Equal(t, len(diagnostics), 2)
	for index, diagnostic := range diagnostics {
		want := "Expected a space before the binary operator '='."
		if index == 1 {
			want = "Expected a space after the binary operator '='."
		}
		assert.Equal(t, diagnostic.Localize(locale.Default), want)
		assert.Equal(t, diagnostic.MessageText(), "")
	}
}

func TestFormattingDiagnosticMessages(t *testing.T) {
	t.Parallel()
	for _, test := range []struct {
		name    string
		text    string
		kind    core.ScriptKind
		options func(*lsutil.FormatCodeSettings)
		want    string
	}{
		{"comma", "const value = [1,2];", core.ScriptKindTS, nil, "Expected a space after ','."},
		{"function body", "function value(){\n    return 1;\n}", core.ScriptKindTS, nil, "Expected a space before the function body."},
		{"indentation", "function value() {\nreturn 1;\n}", core.ScriptKindTS, nil, "Expected indentation of 4 columns."},
		{"trailing whitespace", "const value = 1;  \nconst other = 2;", core.ScriptKindTS, nil, "Trailing whitespace is not allowed."},
		{"semicolon insertion", "const value = 1", core.ScriptKindTS, func(options *lsutil.FormatCodeSettings) { options.Semicolons = lsutil.SemicolonPreferenceInsert }, "Expected a semicolon at the end of the statement."},
		{"semicolon removal", "const value = 1;", core.ScriptKindTS, func(options *lsutil.FormatCodeSettings) { options.Semicolons = lsutil.SemicolonPreferenceRemove }, "Unnecessary semicolon."},
		{"operator removal", "const value = 1;", core.ScriptKindTS, func(options *lsutil.FormatCodeSettings) {
			options.InsertSpaceBeforeAndAfterBinaryOperators = core.TSFalse
		}, "Unexpected whitespace before the binary operator '='."},
		{"JSX", "const value = <Item enabled={true}/>;", core.ScriptKindTSX, nil, "Expected a space before the self-closing JSX tag terminator."},
		{"JSX opening delimiter", "const value=<Item/>;", core.ScriptKindTSX, nil, "Expected a space before '<'."},
	} {
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()
			options := lsutil.GetDefaultFormatCodeSettings()
			if test.options != nil {
				test.options(&options)
			}
			ctx := format.WithFormatCodeSettings(t.Context(), options, "\n")
			file := parser.ParseSourceFile(ast.SourceFileParseOptions{FileName: "/input.tsx", PathKey: "/input.tsx"}, test.text, test.kind)
			edits, reported, err := format.FormatRangesWithDiagnostics(ctx, file, nil)
			assert.NilError(t, err)
			assert.Assert(t, slices.Equal(edits, format.FormatDocument(ctx, file)))
			assert.Equal(t, len(reported), len(edits))
			assert.Assert(t, slices.ContainsFunc(reported, func(diagnostic *ast.Diagnostic) bool {
				return diagnostic.Localize(locale.Default) == test.want
			}), "Expected %q among %v", test.want, reported)
			german, ok := locale.Parse("de")
			assert.Assert(t, ok)
			for _, diagnostic := range reported {
				assert.Assert(t, diagnostic.Localize(german) != "")
			}
		})
	}
}

func TestFormattingDiagnosticSpans(t *testing.T) {
	t.Parallel()
	const text = "// \u03bb \U0001f600\nconst first=1;\nconst middle=2;\nconst last=3;"
	file := parser.ParseSourceFile(ast.SourceFileParseOptions{FileName: "/input.ts", PathKey: "/input.ts"}, text, core.ScriptKindTS)
	ctx := format.WithFormatCodeSettings(t.Context(), lsutil.GetDefaultFormatCodeSettings(), "\n")
	first := core.NewTextRange(strings.Index(text, "const first"), strings.Index(text, "const middle"))
	last := core.NewTextRange(strings.Index(text, "const last"), len(text))
	edits, err := format.FormatRanges(ctx, file, []core.TextRange{last, first, last})
	assert.NilError(t, err)
	assert.Equal(t, len(edits), 4)
	_, reported, err := format.FormatRangesWithDiagnostics(ctx, file, []core.TextRange{last, first, last})
	assert.NilError(t, err)
	for _, diagnostic := range reported {
		assert.Assert(t, diagnostic.Code() != int32(18128))
		assert.Assert(t, diagnostic.Loc().ContainedBy(first) || diagnostic.Loc().ContainedBy(last))
	}
	empty, err := format.FormatRanges(ctx, file, []core.TextRange{})
	assert.NilError(t, err)
	assert.Equal(t, len(empty), 0)
	all, err := format.FormatRanges(ctx, file, nil)
	assert.NilError(t, err)
	assert.Equal(t, len(all), 6)
	for _, span := range []core.TextRange{core.NewTextRange(-1, 0), core.NewTextRange(5, 2), core.NewTextRange(0, len(text)+1), core.NewTextRange(4, 5)} {
		_, err := format.FormatRanges(ctx, file, []core.TextRange{span})
		assert.ErrorContains(t, err, "invalid formatting span")
	}
}
