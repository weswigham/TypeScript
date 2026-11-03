package tsoptions

import (
	"cmp"
	"slices"
	"strconv"
	"strings"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/tspath"
)

type FormattingLineRange struct {
	Start int
	End   int
}

type FormattingSelection struct {
	fileNames []tspath.RootedFilePath
	ranges    map[tspath.PathKey][]FormattingLineRange
}

func (p *ParsedCommandLine) FormattingSelection() FormattingSelection {
	selection := FormattingSelection{ranges: cloneFormattingRanges(p.FormattingRanges)}
	if p.CompilerOptions().FormatOnly.IsTrue() {
		selection.fileNames = slices.Clone(p.FileNames())
	}
	return selection
}

func (s FormattingSelection) Apply(config *ParsedCommandLine) *ParsedCommandLine {
	fileNames := config.FileNames()
	if len(s.fileNames) > 0 {
		fileNames = s.fileNames
	}
	result := config.WithFileNames(slices.Clone(fileNames))
	result.FormattingRanges = cloneFormattingRanges(s.ranges)
	return result
}

func cloneFormattingRanges(ranges map[tspath.PathKey][]FormattingLineRange) map[tspath.PathKey][]FormattingLineRange {
	if ranges == nil {
		return nil
	}
	result := make(map[tspath.PathKey][]FormattingLineRange, len(ranges))
	for path, spans := range ranges {
		result[path] = slices.Clone(spans)
	}
	return result
}

func validateFormattingOptions(options *core.CompilerOptions) []*ast.Diagnostic {
	if options.FormatDiagnostics.IsTrue() && !options.Format.IsTrue() && !options.FormatOnly.IsTrue() {
		return []*ast.Diagnostic{ast.NewCompilerDiagnostic(diagnostics.Option_0_cannot_be_specified_without_specifying_option_1_or_option_2, "formatDiagnostics", "format", "formatOnly")}
	}
	return nil
}

func (p *commandLineParser) parseFormattingRanges(options *core.CompilerOptions) map[tspath.PathKey][]FormattingLineRange {
	if !options.FormatOnly.IsTrue() && !options.Format.IsTrue() && !options.FormatDiagnostics.IsTrue() {
		return nil
	}
	var ranges map[tspath.PathKey][]FormattingLineRange
	wholeFiles := map[tspath.PathKey]bool{}
	for i, fileName := range p.fileNames {
		colon := strings.LastIndexByte(fileName, ':')
		if colon <= 1 {
			wholeFiles[p.fs.CaseSensitivity().PathKey(tspath.ToRootedFilePath(fileName, p.currentDirectory).AsPath())] = true
			continue
		}
		if !options.FormatOnly.IsTrue() {
			p.errors = append(p.errors, ast.NewCompilerDiagnostic(diagnostics.File_line_ranges_require_formatOnly))
			continue
		}
		if options.Watch.IsTrue() {
			p.errors = append(p.errors, ast.NewCompilerDiagnostic(diagnostics.Formatting_line_ranges_cannot_be_combined_with_watch))
			continue
		}
		name, specification := fileName[:colon], fileName[colon+1:]
		p.fileNames[i] = name
		path := p.fs.CaseSensitivity().PathKey(tspath.ToRootedFilePath(name, p.currentDirectory).AsPath())
		for part := range strings.SplitSeq(specification, ",") {
			startText, endText, hasEnd := strings.Cut(part, "-")
			if !hasEnd {
				endText = startText
			}
			start, startErr := strconv.Atoi(startText)
			end, endErr := strconv.Atoi(endText)
			if startErr != nil || endErr != nil || start < 1 || end < start {
				p.errors = append(p.errors, ast.NewCompilerDiagnostic(diagnostics.Invalid_formatting_line_range_0_Expected_positive_inclusive_line_ranges_such_as_120_500_1001_2100, part))
				continue
			}
			if ranges == nil {
				ranges = map[tspath.PathKey][]FormattingLineRange{}
			}
			ranges[path] = append(ranges[path], FormattingLineRange{Start: start, End: end})
		}
	}
	for path, values := range ranges {
		if wholeFiles[path] {
			delete(ranges, path)
			continue
		}
		slices.SortFunc(values, func(a, b FormattingLineRange) int {
			return cmp.Or(cmp.Compare(a.Start, b.Start), cmp.Compare(a.End, b.End))
		})
		merged := values[:0]
		for _, value := range values {
			if len(merged) > 0 && value.Start-1 <= merged[len(merged)-1].End {
				merged[len(merged)-1].End = max(merged[len(merged)-1].End, value.End)
			} else {
				merged = append(merged, value)
			}
		}
		ranges[path] = merged
	}
	return ranges
}
