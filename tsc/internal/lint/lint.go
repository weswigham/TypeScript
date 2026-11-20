package lint

import (
	"context"
	"slices"
	"sync/atomic"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/checker"
	"github.com/microsoft/TypeScript/tsc/internal/compiler"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	linthost "github.com/microsoft/TypeScript/tsc/internal/lint/host"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules"
	"github.com/microsoft/TypeScript/tsc/internal/ls/change"
	"github.com/microsoft/TypeScript/tsc/internal/ls/lsutil"
)

type fileState struct {
	file        *ast.SourceFile
	rules       *fileRuleSet
	directives  []lintDirective
	output      []*ast.Diagnostic
	reportRules map[*ast.Diagnostic]string
	failed      bool
}

func GetDiagnostics(ctx context.Context, program *compiler.Program) []*ast.Diagnostic {
	options := program.Options()
	if (!options.Lint.IsTrue() && !options.LintOnly.IsTrue()) || options.ListFilesOnly.IsTrue() {
		return nil
	}
	return getDiagnostics(ctx, program, program.GetSourceFiles())
}

func GetDiagnosticsForFile(ctx context.Context, program *compiler.Program, file *ast.SourceFile) []*ast.Diagnostic {
	return getDiagnostics(ctx, program, []*ast.SourceFile{file})
}

func getDiagnostics(ctx context.Context, program *compiler.Program, files []*ast.SourceFile) []*ast.Diagnostic {
	options := program.Options()
	files = core.Filter(files, func(file *ast.SourceFile) bool {
		if canonical := file.CanonicalSourceFile(); canonical != nil {
			return program.IsFormattingInput(canonical)
		}
		return program.IsFormattingInput(file)
	})
	sets, plugins, customRules, result := prepareRuleSets(ctx, program, files)
	if sets == nil {
		return compiler.SortAndDeduplicateDiagnostics(result)
	}
	states := make([]fileState, len(files))
	unusedSeverity := ""
	if lint := program.CommandLine().ParsedConfig.Lint; lint != nil {
		unusedSeverity = lint.ReportUnusedDisableDirectives
	}
	hasNative := slices.ContainsFunc(sets, func(set *fileRuleSet) bool { return set != nil && len(set.names) != 0 })
	var warmup <-chan error
	if plugins != nil {
		if host, ok := plugins.host.(interface {
			Warmup(ctx context.Context, options linthost.PluginOptions, workerCount int) error
		}); ok {
			activeFiles := 0
			for _, set := range sets {
				if set != nil && len(set.custom) != 0 {
					activeFiles++
				}
			}
			if count := min(plugins.host.Workers(), activeFiles); count > 1 {
				done := make(chan error, 1)
				warmup = done
				go func() {
					done <- host.Warmup(ctx, plugins.options, count)
				}()
			}
		}
	}
	if hasNative {
		program.BindSourceFiles()
	}
	group := core.NewWorkGroup(options.SingleThreaded.IsTrue())
	for index, file := range files {
		if sets[index] == nil {
			continue
		}
		group.Queue(func() {
			state := &states[index]
			state.file = file
			state.rules = sets[index]
			state.directives, state.output = parseDirectives(file, customRules)
			lintNativeFile(ctx, program, state)
		})
	}
	group.RunAndWait()
	if warmup != nil {
		if err := <-warmup; err != nil && ctx.Err() == nil {
			result = append(result, ast.NewCompilerDiagnostic(diagnostics.Lint_plugin_failed_Colon_0, err.Error()))
		}
	}
	if plugins != nil {
		batches := pluginBatches(states, plugins.host.Workers())
		var next atomic.Uint64
		group := core.NewWorkGroup(options.SingleThreaded.IsTrue())
		for range min(plugins.host.Workers(), len(batches)) {
			group.Queue(func() {
				for ctx.Err() == nil {
					index := int(next.Add(1)) - 1
					if index >= len(batches) {
						return
					}
					batch := &batches[index]
					var output *linthost.BatchResult
					var err error
					if host, ok := plugins.host.(ProjectHost); ok {
						output, err = host.LintBatchWithProject(ctx, program, plugins.options, batch.rules, batch.files, projectBindingFromContext(ctx))
					} else {
						output, err = plugins.host.LintBatch(ctx, program, plugins.options, batch.rules, batch.files)
					}
					if err != nil {
						if ctx.Err() != nil {
							return
						}
						for _, state := range batch.states {
							state.failed = true
							state.output = append(state.output, ast.NewDiagnostic(state.file, core.NewTextRange(0, 0), diagnostics.Lint_plugin_failed_Colon_0, err.Error()))
						}
					} else {
						for fileIndex, file := range output.Files {
							state := batch.states[fileIndex]
							for _, message := range file.Messages {
								reports, reportErr := externalDiagnostics(state.file, state.rules, []linthost.Message{message})
								if reportErr != nil {
									state.failed = true
									state.output = append(state.output, ast.NewDiagnostic(state.file, core.NewTextRange(0, 0), diagnostics.Lint_plugin_failed_Colon_0, reportErr.Error()))
								} else {
									state.output = append(state.output, reports...)
								}
							}
							if file.Error != "" {
								state.failed = true
								state.output = append(state.output, ast.NewDiagnostic(state.file, core.NewTextRange(0, 0), diagnostics.Lint_plugin_failed_Colon_0, file.Error))
							}
						}
					}
				}
			})
		}
		group.RunAndWait()
	}
	for index := range states {
		state := &states[index]
		if len(state.directives) != 0 {
			state.output = core.Filter(state.output, func(diagnostic *ast.Diagnostic) bool {
				name := diagnostic.LintRuleName()
				if name == "" {
					name = state.reportRules[diagnostic]
				}
				return name == "" || !isSuppressed(state.file, state.directives, name, diagnostic.Loc())
			})
			if !state.failed && unusedSeverity != "" && unusedSeverity != "off" {
				state.output = append(state.output, unusedDirectiveDiagnostics(state.file, state.directives, unusedSeverity)...)
			}
		}
		result = append(result, state.output...)
	}
	return compiler.SortAndDeduplicateDiagnostics(result)
}

func lintNativeFile(ctx context.Context, program *compiler.Program, state *fileState) {
	if len(state.rules.names) == 0 {
		return
	}
	config := program.CommandLine()
	options := program.Options()
	file := state.file
	if len(state.directives) != 0 {
		state.reportRules = make(map[*ast.Diagnostic]string)
	}
	var typeChecker *checker.Checker
	var release func()
	defer func() {
		if release != nil {
			release()
		}
	}()
	getChecker := func() *checker.Checker {
		if typeChecker == nil {
			typeChecker, release = program.GetTypeCheckerForFileExclusive(ctx, file)
		}
		return typeChecker
	}
	visitors := make([]rules.Rule, 0, len(state.rules.names))
	for _, name := range state.rules.names {
		visitors = append(visitors, rules.Factories[name](rules.Context{
			CompilerOptions:  options,
			CurrentDirectory: program.GetCurrentDirectory(),
			File:             file,
			Options:          state.rules.options[name],
			GetChecker:       getChecker,
			NewTracker: func() *change.Tracker {
				return change.NewTracker(ctx, options, lsutil.GetDefaultFormatCodeSettings().WithOptions(config.FormattingOptions()), nil)
			},
			Report: func(location core.TextRange, message *diagnostics.Message, args ...any) *ast.Diagnostic {
				diagnostic := ast.NewDiagnostic(file, location, message, args...)
				if state.rules.severities[name] == "warning" {
					diagnostic.SetCategory(diagnostics.CategoryWarning)
				}
				state.output = append(state.output, diagnostic)
				if state.reportRules != nil {
					state.reportRules[diagnostic] = name
				}
				return diagnostic
			},
		}))
	}
	Walk(file.AsNode(), visitors)
	for _, visitor := range visitors {
		if visitor.GetSuggestions != nil {
			for diagnostic, suggestions := range visitor.GetSuggestions() {
				diagnostic.SetCodeFixSuggestions(suggestions...)
			}
		}
	}
}
