package lint

import (
	"strconv"
	"strings"
	"testing"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/checker"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/diagnostics"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules"
	"github.com/microsoft/TypeScript/tsc/internal/ls/change"
	"github.com/microsoft/TypeScript/tsc/internal/ls/lsutil"
)

var typedBenchmarkRules = []string{
	"await-thenable",
	"consistent-return",
	"consistent-type-exports",
	"dot-notation",
	"no-array-delete",
	"no-base-to-string",
	"no-confusing-void-expression",
	"no-deprecated",
	"no-duplicate-type-constituents",
	"no-floating-promises",
	"no-for-in-array",
	"no-generated-empty-object-type",
	"no-implied-eval",
	"no-meaningless-void-operator",
	"no-misused-promises",
	"no-misused-spread",
	"no-mixed-enums",
	"no-redundant-type-constituents",
	"no-unnecessary-boolean-literal-compare",
	"no-unnecessary-condition",
	"no-unnecessary-qualifier",
	"no-unnecessary-template-expression",
	"no-unnecessary-type-arguments",
	"no-unnecessary-type-assertion",
	"no-unnecessary-type-conversion",
	"no-unnecessary-type-parameters",
	"no-unsafe-argument",
	"no-unsafe-assignment",
	"no-unsafe-call",
	"no-unsafe-enum-assignment",
	"no-unsafe-enum-comparison",
	"no-unsafe-member-access",
	"no-unsafe-return",
	"no-unsafe-type-assertion",
	"no-unsafe-unary-minus",
	"no-useless-default-assignment",
	"non-nullable-type-assertion-style",
	"only-throw-error",
	"prefer-find",
	"prefer-includes",
	"prefer-nullish-coalescing",
	"prefer-optional-chain",
	"prefer-promise-reject-errors",
	"prefer-readonly",
	"prefer-readonly-parameter-types",
	"prefer-reduce-type-parameter",
	"prefer-regexp-exec",
	"prefer-return-this-type",
	"prefer-string-starts-ends-with",
	"promise-function-async",
	"related-getter-setter-pairs",
	"require-array-sort-compare",
	"require-await",
	"restrict-plus-operands",
	"restrict-template-expressions",
	"return-await",
	"strict-boolean-expressions",
	"strict-void-return",
	"switch-exhaustiveness-check",
	"unbound-method",
	"use-unknown-in-catch-callback-variable",
}

func BenchmarkLintWalkStrategies(b *testing.B) {
	for _, count := range []int{1, len(typedBenchmarkRules)} {
		b.Run(strconv.Itoa(count)+"_rules", func(b *testing.B) {
			for _, dirty := range []bool{false, true} {
				b.Run("diagnostics="+strconv.FormatBool(dirty), func(b *testing.B) {
					for _, separate := range []bool{false, true} {
						name := "shared"
						if separate {
							name = "separate"
						}
						b.Run(name, func(b *testing.B) {
							const expressions = 500
							statement := "await Promise.resolve(0);\n"
							expected := 0
							if dirty {
								statement = "await 0;\n"
								expected = expressions
							}
							source := "export async function inspect() {\n" + strings.Repeat(statement, expressions) + "}\n"
							settings := `"@typescript-eslint/` + strings.Join(typedBenchmarkRules[:count], `":"error","@typescript-eslint/`) + `":"error"`
							program := lintTestProgram(b, "input.ts", source, settings)
							program.BindSourceFiles()
							file := program.GetSourceFile("/project/input.ts")
							typeChecker, release := program.GetTypeCheckerForFileExclusive(b.Context(), file)
							b.Cleanup(release)
							reports := 0
							context := rules.Context{
								CompilerOptions:  program.Options(),
								CurrentDirectory: "/project",
								File:             file,
								GetChecker:       func() *checker.Checker { return typeChecker },
								NewTracker: func() *change.Tracker {
									return change.NewTracker(b.Context(), program.Options(), lsutil.GetDefaultFormatCodeSettings(), nil)
								},
								Report: func(location core.TextRange, message *diagnostics.Message, args ...any) *ast.Diagnostic {
									reports++
									return ast.NewDiagnostic(file, location, message, args...)
								},
							}
							run := func() {
								reports = 0
								visitors := make([]rules.Rule, 0, count)
								for _, rule := range typedBenchmarkRules[:count] {
									visitors = append(visitors, rules.Factories["@typescript-eslint/"+rule](context))
								}
								if separate {
									for _, visitor := range visitors {
										Walk(file.AsNode(), []rules.Rule{visitor})
									}
								} else {
									Walk(file.AsNode(), visitors)
								}
								if reports != expected {
									b.Fatalf("reports = %d, want %d", reports, expected)
								}
							}
							run()
							b.ReportAllocs()
							b.SetBytes(int64(len(source)))
							for b.Loop() {
								run()
							}
						})
					}
				})
			}
		})
	}
}
