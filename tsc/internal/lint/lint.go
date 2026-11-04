package lint

import (
	"context"
	"slices"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/checker"
	"github.com/microsoft/TypeScript/tsc/internal/compiler"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules"
	"github.com/microsoft/TypeScript/tsc/internal/locale"
	"github.com/microsoft/TypeScript/tsc/internal/ls/change"
	"github.com/microsoft/TypeScript/tsc/internal/ls/lsutil"
	"github.com/microsoft/TypeScript/tsc/internal/scanner"
)

func Walk(node *ast.Node, visitors []rules.Rule) {
	stack := make([]int, 0, len(visitors))
	for index := range visitors {
		stack = append(stack, index)
	}
	var visit func(*ast.Node, []int)
	visit = func(node *ast.Node, active []int) {
		base := len(stack)
		for _, index := range active {
			if visitors[index].OnEnterNode(node) {
				stack = append(stack, index)
			}
		}
		entered := stack[base:]
		if len(entered) > 0 {
			node.ForEachChild(func(child *ast.Node) bool {
				visit(child, entered)
				return false
			})
			for _, index := range entered {
				visitors[index].OnExitNode(node)
			}
		}
		stack = stack[:base]
	}
	if node != nil && len(visitors) > 0 {
		visit(node, stack)
	}
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
	config := program.CommandLine()
	options := config.CompilerOptions()
	var names []string
	var result []*ast.Diagnostic
	for name, severity := range config.LintRules() {
		if _, ok := rules.Factories[name]; !ok {
			result = append(result, ast.NewCompilerDiagnostic(diagnostics.Unknown_lint_rule_0, name))
		} else if severity != "off" {
			names = append(names, name)
		}
	}
	if len(names) == 0 {
		return compiler.SortAndDeduplicateDiagnostics(result)
	}
	slices.Sort(names)
	files = core.Filter(files, func(file *ast.SourceFile) bool {
		return !file.IsDeclarationFile && program.IsFormattingInput(file)
	})
	outputs := make([][]*ast.Diagnostic, len(files))
	group := core.NewWorkGroup(options.SingleThreaded.IsTrue())
	for index, file := range files {
		group.Queue(func() {
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
			visitors := make([]rules.Rule, 0, len(names))
			for _, name := range names {
				visitors = append(visitors, rules.Factories[name](rules.Context{
					File:       file,
					Locale:     locale.FromContext(ctx),
					GetChecker: getChecker,
					NewTracker: func() *change.Tracker {
						return change.NewTracker(ctx, options, lsutil.GetDefaultFormatCodeSettings().WithOptions(config.FormattingOptions()), nil)
					},
					Report: func(node *ast.Node, message *diagnostics.Message, args ...any) *ast.Diagnostic {
						start := scanner.GetTokenPosOfNode(node, file, false)
						diagnostic := ast.NewDiagnostic(file, core.NewTextRange(start, node.End()), message, args...)
						if config.LintRules()[name] == "warning" {
							diagnostic.SetCategory(diagnostics.CategoryWarning)
						}
						outputs[index] = append(outputs[index], diagnostic)
						return diagnostic
					},
				}))
			}
			Walk(file.AsNode(), visitors)
		})
	}
	group.RunAndWait()
	for _, output := range outputs {
		result = append(result, output...)
	}
	return compiler.SortAndDeduplicateDiagnostics(result)
}
