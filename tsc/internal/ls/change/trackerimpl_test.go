package change

import (
	"testing"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/ls/lsconv"
	"github.com/microsoft/TypeScript/tsc/internal/ls/lsutil"
	"github.com/microsoft/TypeScript/tsc/internal/lsp/lsproto"
	"github.com/microsoft/TypeScript/tsc/internal/parser"
	"github.com/microsoft/TypeScript/tsc/internal/spanmap"
	"github.com/microsoft/TypeScript/tsc/internal/tspath"
	"gotest.tools/v3/assert"
)

func TestTextEditsConflictAtSameInsertionPointAcrossProjections(t *testing.T) {
	t.Parallel()

	position := lsproto.Position{Line: 1, Character: 2}
	a := &lsproto.TextEdit{Range: lsproto.Range{Start: position, End: position}, NewText: "a"}
	b := &lsproto.TextEdit{Range: lsproto.Range{Start: position, End: position}, NewText: "b"}

	if !textEditsConflict(a, b, true) {
		t.Fatal("different insertions at the same position across projections should conflict")
	}
	if textEditsConflict(a, b, false) {
		t.Fatal("insertions at the same position within one projection should retain their existing ordering")
	}
}

func TestStatementChangeBoundaries(t *testing.T) {
	t.Parallel()
	for _, operation := range []string{"delete", "replace", "nested replacement", "kind replacement", "directive"} {
		for _, lsp := range []bool{false, true} {
			name := operation + "/native"
			if lsp {
				name = operation + "/lsp"
			}
			t.Run(name, func(t *testing.T) {
				t.Parallel()
				text := "first()\ndebugger;\n(second());"
				if operation == "replace" {
					text = "first()\nsecond();"
				} else if operation == "nested replacement" {
					text = "first()\nsecond;"
				} else if operation == "kind replacement" {
					text = "function first() {}\n(second());"
				} else if operation == "directive" {
					text = "debugger;\n'use strict';"
				}
				opts := ast.SourceFileParseOptions{FileName: "/input.ts", PathKey: "/input.ts"}
				file := parser.ParseSourceFile(opts, text, core.ScriptKindTS)
				converters := lsconv.NewConverters(lsproto.PositionEncodingKindUTF16, func(_ tspath.RootedFilePath) *lsconv.LSPLineMap {
					return lsconv.ComputeLSPLineStarts(text)
				})
				settings := lsutil.GetDefaultFormatCodeSettings()
				if operation == "kind replacement" {
					settings.Semicolons = lsutil.SemicolonPreferenceRemove
				}
				tracker := NewTracker(t.Context(), &core.CompilerOptions{}, settings, converters)
				switch operation {
				case "delete":
					tracker.Delete(file, file.Statements.Nodes[1])
				case "replace":
					tracker.ReplaceNode(file, file.Statements.Nodes[1], tracker.NewExpressionStatement(tracker.NewParenthesizedExpression(tracker.NewIdentifier("second"))), nil)
				case "nested replacement":
					tracker.ReplaceNode(file, file.Statements.Nodes[1].Expression(), tracker.NewParenthesizedExpression(tracker.NewIdentifier("second")), nil)
				case "kind replacement":
					tracker.ReplaceNode(file, file.Statements.Nodes[0], tracker.NewExpressionStatement(tracker.NewIdentifier("first")), nil)
				case "directive":
					tracker.Delete(file, file.Statements.Nodes[0])
				}
				var edits []core.TextChange
				if lsp {
					changes, unmappable := tracker.GetChanges()
					assert.Equal(t, len(unmappable), 0)
					for _, edit := range changes["/input.ts"] {
						mapped := converters.FromLSPRangeForSourceFile(file, edit.Range, spanmap.FeatureAll)
						edits = append(edits, core.TextChange{TextRange: mapped[0].Span, NewText: edit.NewText})
					}
				} else {
					edits = tracker.GetTextChanges()[0].TextChanges
				}
				fixed := core.ApplyBulkEdits(text, edits)
				parsed := parser.ParseSourceFile(opts, fixed, core.ScriptKindTS)
				assert.Equal(t, len(parsed.Statements.Nodes), 2, "%s", fixed)
				if operation == "directive" {
					assert.Assert(t, !ast.IsPrologueDirective(parsed.Statements.Nodes[0]), "%s", fixed)
				}
			})
		}
	}
}
