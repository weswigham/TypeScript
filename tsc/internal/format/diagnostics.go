package format

import (
	"cmp"
	"context"
	"fmt"
	"slices"
	"unicode/utf8"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
)

type formattingDiagnostic struct {
	message *diagnostics.Message
	args    []any
}

type formattingDiagnosticsKey struct{}

type formattingDiagnosticCollector struct {
	reasons map[core.TextChange]formattingDiagnostic
}

func getFormattingDiagnosticCollector(ctx context.Context) *formattingDiagnosticCollector {
	collector, _ := ctx.Value(formattingDiagnosticsKey{}).(*formattingDiagnosticCollector)
	return collector
}

func FormatRangesWithDiagnostics(ctx context.Context, file *ast.SourceFile, ranges []core.TextRange) ([]core.TextChange, []*ast.Diagnostic, error) {
	collector := &formattingDiagnosticCollector{reasons: make(map[core.TextChange]formattingDiagnostic)}
	ctx = context.WithValue(ctx, formattingDiagnosticsKey{}, collector)
	edits, err := FormatRanges(ctx, file, ranges)
	if err != nil {
		return nil, nil, err
	}
	result := make([]*ast.Diagnostic, 0, len(edits))
	for _, edit := range edits {
		reason := collector.reasons[edit]
		result = append(result, ast.NewDiagnostic(file, edit.TextRange, reason.message, reason.args...))
	}
	return edits, result, nil
}

// FormatRanges restricts edits to the union of half-open byte ranges.
// A nil range list formats the document; an empty list formats nothing.
func FormatRanges(ctx context.Context, file *ast.SourceFile, ranges []core.TextRange) ([]core.TextChange, error) {
	if ranges == nil {
		return FormatDocument(ctx, file), nil
	}
	ranges = slices.Clone(ranges)
	text := file.Text()
	for _, span := range ranges {
		if span.Pos() < 0 || span.End() < span.Pos() || span.End() > len(text) ||
			span.Pos() < len(text) && !utf8.RuneStart(text[span.Pos()]) ||
			span.End() < len(text) && !utf8.RuneStart(text[span.End()]) {
			return nil, fmt.Errorf("invalid formatting span [%d, %d) in %s", span.Pos(), span.End(), file.FileName())
		}
	}
	slices.SortFunc(ranges, func(a, b core.TextRange) int {
		return cmp.Or(cmp.Compare(a.Pos(), b.Pos()), cmp.Compare(a.End(), b.End()))
	})
	merged := ranges[:0]
	for _, span := range ranges {
		if len(merged) > 0 && span.Pos() <= merged[len(merged)-1].End() {
			last := &merged[len(merged)-1]
			*last = last.WithEnd(max(last.End(), span.End()))
		} else {
			merged = append(merged, span)
		}
	}
	var edits []core.TextChange
	for _, span := range merged {
		for _, edit := range FormatSelection(ctx, file, span.Pos(), span.End()) {
			if edit.Pos() >= span.Pos() && edit.End() <= span.End() &&
				(edit.Pos() < span.End() || span.End() == len(text)) {
				edits = append(edits, edit)
			}
		}
	}
	slices.SortStableFunc(edits, func(a, b core.TextChange) int {
		return cmp.Or(cmp.Compare(a.Pos(), b.Pos()), cmp.Compare(a.End(), b.End()))
	})
	return slices.Compact(edits), nil
}
