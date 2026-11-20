package tsc

import (
	"context"
	"fmt"
	"io"
	"runtime"
	"slices"
	"time"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/collections"
	"github.com/microsoft/TypeScript/tsc/internal/compiler"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/execute/incremental"
	"github.com/microsoft/TypeScript/tsc/internal/lint"
	"github.com/microsoft/TypeScript/tsc/internal/locale"
	"github.com/microsoft/TypeScript/tsc/internal/tracing"
	"github.com/microsoft/TypeScript/tsc/internal/tsoptions"
	"github.com/microsoft/TypeScript/tsc/internal/tspath"
)

func GetTraceWithWriterFromSys(w io.Writer, locale locale.Locale, testing CommandLineTesting) func(msg *diagnostics.Message, args ...any) {
	if testing == nil {
		return func(msg *diagnostics.Message, args ...any) {
			fmt.Fprintln(w, msg.Localize(locale, args...))
		}
	} else {
		return testing.GetTrace(w, locale)
	}
}

type EmitInput struct {
	LintHost              lint.Host
	FormattingDiagnostics []*ast.Diagnostic
	Sys                   System
	ProgramLike           compiler.ProgramLike
	Program               *compiler.Program
	Config                *tsoptions.ParsedCommandLine
	ReportDiagnostic      DiagnosticReporter
	ReportErrorSummary    DiagnosticsReporter
	Writer                io.Writer
	WriteFile             compiler.WriteFile
	CompileTimes          *CompileTimes
	Testing               CommandLineTesting
	TestingMTimesCache    *collections.SyncMap[tspath.PathKey, time.Time]
	Tracing               *tracing.Tracing
	fixPass               int
	fixDiagnostics        []*ast.Diagnostic
}

func EmitAndReportStatistics(ctx context.Context, input EmitInput) (CompileAndEmitResult, *Statistics) {
	var statistics *Statistics
	result := EmitFilesAndReportErrors(ctx, input)
	if result.Status != ExitStatusSuccess {
		// compile exited early
		return result, nil
	}
	result.times.totalTime = input.Sys.SinceStart()
	input.ProgramLike = result.Program
	input.Program = result.Program.Program()

	if input.Config.CompilerOptions().Diagnostics.IsTrue() || input.Config.CompilerOptions().ExtendedDiagnostics.IsTrue() {
		var memStats runtime.MemStats
		// GC must be called twice to allow things to settle.
		runtime.GC()
		runtime.GC()
		runtime.ReadMemStats(&memStats)

		statistics = statisticsFromProgram(input, &memStats)
		statistics.Report(input.Writer, input.Testing)
	}

	if result.EmitResult.EmitSkipped && CountErrors(result.Diagnostics) > 0 {
		result.Status = ExitStatusDiagnosticsPresent_OutputsSkipped
	} else if CountErrors(result.Diagnostics) > 0 {
		result.Status = ExitStatusDiagnosticsPresent_OutputsGenerated
	}
	return result, statistics
}

func EmitFilesAndReportErrors(ctx context.Context, input EmitInput) (result CompileAndEmitResult) {
	result.times = input.CompileTimes
	result.Program = input.ProgramLike
	result.EmitResult = &compiler.EmitResult{EmitSkipped: true}
	result.Status = ExitStatusDiagnosticsPresent_OutputsSkipped
	ctx = lint.WithHost(ctx, input.LintHost)
	if ctx.Err() != nil {
		return result
	}

	allDiagnostics := compiler.GetDiagnosticsOfAnyProgram(
		ctx,
		input.ProgramLike,
		nil,
		false,
		func(ctx context.Context, file *ast.SourceFile) []*ast.Diagnostic {
			// Options diagnostics include global diagnostics (even though we collect them separately),
			// and global diagnostics create checkers, which then bind all of the files. Do this binding
			// early so we can track the time.
			if tr := input.Tracing; tr != nil {
				defer tr.Push(tracing.PhaseBind, "bindSourceFiles", nil, true)()
			}
			bindStart := input.Sys.Now()
			diags := input.ProgramLike.GetBindDiagnostics(ctx, file)
			result.times.bindTime = input.Sys.Now().Sub(bindStart)
			return diags
		},
		func(ctx context.Context, file *ast.SourceFile) []*ast.Diagnostic {
			if tr := input.Tracing; tr != nil {
				defer tr.Push(tracing.PhaseCheck, "checkSourceFiles", nil, true)()
			}
			checkStart := input.Sys.Now()
			diags := input.ProgramLike.GetSemanticDiagnostics(ctx, file)
			result.times.checkTime = input.Sys.Now().Sub(checkStart)
			if program, ok := input.ProgramLike.(*incremental.Program); ok {
				nestedEmitTime := program.TakeNestedEmitTime()
				if nestedEmitTime > result.times.checkTime {
					result.times.checkTime = 0
				} else {
					result.times.checkTime -= nestedEmitTime
				}
				result.times.emitTime += nestedEmitTime
			}
			return diags
		},
	)
	if ctx.Err() != nil {
		return result
	}
	emitResult := &compiler.EmitResult{EmitSkipped: true, Diagnostics: []*ast.Diagnostic{}}
	lintDiagnostics := lint.GetDiagnostics(ctx, input.Program)
	if ctx.Err() != nil {
		return result
	}
	if input.Config.CompilerOptions().Fix.IsTrue() && input.fixPass < 10 {
		changed, errors := ApplyLintFixes(input.Sys.FS(), input.Program, lintDiagnostics)
		input.fixDiagnostics = append(input.fixDiagnostics, errors...)
		if len(changed) > 0 {
			host := input.Program.Host()
			freshHost := compiler.NewCompilerHost(input.Sys.FS(), host.DefaultLibraryPath(), nil, host.Trace, host.ContentMapperProject())
			input.Program = compiler.NewProgram(compiler.ProgramOptions{Config: input.Config, Host: freshHost, Tracing: input.Tracing})
			if previous, ok := input.ProgramLike.(*incremental.Program); ok {
				input.ProgramLike = incremental.NewProgram(input.Program, previous, incremental.CreateHost(freshHost), input.Sys.Now, input.Testing != nil)
			} else {
				input.ProgramLike = input.Program
			}
			input.fixPass++
			result = EmitFilesAndReportErrors(ctx, input)
			result.FixedFiles = append(changed, result.FixedFiles...)
			return result
		}
	}
	if !input.ProgramLike.Options().ListFilesOnly.IsTrue() && !input.ProgramLike.Options().LintOnly.IsTrue() {
		emitStart := input.Sys.Now()
		emitResult = input.ProgramLike.Emit(ctx, compiler.EmitOptions{
			WriteFile: input.WriteFile,
		})
		result.times.emitTime += input.Sys.Now().Sub(emitStart)
	}
	if ctx.Err() != nil {
		return result
	}
	if emitResult != nil {
		allDiagnostics = append(allDiagnostics, emitResult.Diagnostics...)
	}
	if input.Testing != nil {
		input.Testing.OnEmittedFiles(emitResult, input.TestingMTimesCache)
	}

	result.CompilationDiagnostics = compiler.SortAndDeduplicateDiagnostics(allDiagnostics)
	result.LintDiagnostics = slices.Concat(lintDiagnostics, input.fixDiagnostics)
	allDiagnostics = compiler.SortAndDeduplicateDiagnostics(slices.Concat(result.CompilationDiagnostics, input.FormattingDiagnostics, result.LintDiagnostics))
	for _, diagnostic := range allDiagnostics {
		input.ReportDiagnostic(diagnostic)
	}

	listFiles(input, emitResult)

	input.ReportErrorSummary(allDiagnostics)
	result.Diagnostics = allDiagnostics
	result.EmitResult = emitResult
	result.Status = ExitStatusSuccess
	return result
}

func listFiles(input EmitInput, emitResult *compiler.EmitResult) {
	if input.Testing != nil {
		input.Testing.OnListFilesStart(input.Writer)
		defer input.Testing.OnListFilesEnd(input.Writer)
	}
	options := input.Program.Options()
	if options.ListEmittedFiles.IsTrue() {
		for _, file := range emitResult.EmittedFiles {
			fmt.Fprintln(input.Writer, "TSFILE:", file.AsString())
		}
	}
	if options.ExplainFiles.IsTrue() {
		input.Program.ExplainFiles(input.Writer, input.Config.Locale(), input.Sys.GetCurrentDirectory())
	} else if options.ListFiles.IsTrue() || options.ListFilesOnly.IsTrue() {
		for _, file := range input.Program.GetSourceFiles() {
			fmt.Fprintln(input.Writer, file.FileName())
		}
	}
}
