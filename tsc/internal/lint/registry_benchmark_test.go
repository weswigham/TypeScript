package lint

import (
	"crypto/sha256"
	"fmt"
	"maps"
	"slices"
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

func BenchmarkLintRuleSets(b *testing.B) {
	all := slices.Sorted(maps.Keys(rules.Factories))
	syntax := slices.DeleteFunc(slices.Clone(all), func(name string) bool { return strings.HasPrefix(name, "@typescript-eslint/") })
	typescript := slices.DeleteFunc(slices.Clone(all), func(name string) bool { return !strings.HasPrefix(name, "@typescript-eslint/") })
	for _, set := range []struct {
		name  string
		rules []string
	}{
		{"single", []string{"no-debugger"}},
		{"syntax", syntax},
		{"typescript", typescript},
		{"all", all},
	} {
		b.Run(set.name+"_"+strconv.Itoa(len(set.rules)), func(b *testing.B) {
			for _, reporting := range []bool{false, true} {
				b.Run("reporting="+strconv.FormatBool(reporting), func(b *testing.B) {
					for _, separate := range []bool{false, true} {
						name := "shared"
						if separate {
							name = "separate"
						}
						b.Run(name, func(b *testing.B) {
							benchmarkLintRuleSet(b, set.rules, lintRegistryBenchmarkSource(40, reporting), separate)
						})
					}
				})
			}
		})
	}
}

func BenchmarkLintIndividualRules(b *testing.B) {
	source := lintRegistryBenchmarkSource(4, true)
	for _, name := range slices.Sorted(maps.Keys(rules.Factories)) {
		b.Run(name, func(b *testing.B) {
			benchmarkLintRuleSet(b, []string{name}, source, false)
		})
	}
}

func lintRegistryBenchmarkSource(blocks int, reporting bool) string {
	statement := `{
    const object = { value: 1, get item() { return this.value; }, method() { return this.value; } };
    const values = [1, 2, 3].map(value => value + object.item);
    for (const value of values) {
        if (value > 1) {
            total += value;
        }
    }
    const matched = /a+/.test("value" + total);
    if (matched) {
        total += object.method();
    }
    await Promise.resolve(total);
`
	if reporting {
		statement += "    debugger;\n    total == -0;\n    const unused: any = null;\n"
	}
	statement += "}\n"
	return `export interface Entry { readonly value: number; }
export type Pair<T> = { first: T; second: T; };
export class Bucket {
    constructor(public value: number) {}
    get current(): number { return this.value; }
}
export async function inspect(input: number[]): Promise<number> {
    let total = input.length;
` + strings.Repeat(statement, blocks) + "    return total;\n}\n"
}

func benchmarkLintRuleSet(b *testing.B, names []string, source string, separate bool) {
	settings := `"` + strings.Join(names, `":"error","`) + `":"error"`
	program := lintTestProgram(b, "input.ts", source, settings)
	program.BindSourceFiles()
	file := program.GetSourceFile("/project/input.ts")
	typeChecker, release := program.GetTypeCheckerForFileExclusive(b.Context(), file)
	b.Cleanup(release)
	count, capture := 0, true
	var captured []*ast.Diagnostic
	owners := make(map[*ast.Diagnostic]string)
	run := func() {
		count = 0
		visitors := make([]rules.Rule, 0, len(names))
		for _, name := range names {
			visitors = append(visitors, rules.Factories[name](rules.Context{
				CompilerOptions:  program.Options(),
				CurrentDirectory: "/project",
				File:             file,
				GetChecker:       func() *checker.Checker { return typeChecker },
				NewTracker: func() *change.Tracker {
					return change.NewTracker(b.Context(), program.Options(), lsutil.GetDefaultFormatCodeSettings(), nil)
				},
				Report: func(location core.TextRange, message *diagnostics.Message, args ...any) *ast.Diagnostic {
					count++
					diagnostic := ast.NewDiagnostic(file, location, message, args...)
					if capture {
						captured = append(captured, diagnostic)
						owners[diagnostic] = name
					}
					return diagnostic
				},
			}))
		}
		if separate {
			for _, visitor := range visitors {
				Walk(file.AsNode(), []rules.Rule{visitor})
			}
		} else {
			Walk(file.AsNode(), visitors)
		}
		for _, visitor := range visitors {
			if visitor.GetSuggestions != nil {
				for diagnostic, suggestions := range visitor.GetSuggestions() {
					diagnostic.SetCodeFixSuggestions(suggestions...)
				}
			}
		}
	}
	run()
	expected := count
	keys := make([]string, 0, len(captured))
	for _, diagnostic := range captured {
		keys = append(keys, lintBenchmarkDiagnosticKey(owners[diagnostic], diagnostic))
	}
	slices.Sort(keys)
	b.Logf("diagnostics=%d fingerprint=%x", count, sha256.Sum256([]byte(strings.Join(keys, "\n"))))
	capture, captured, owners = false, nil, nil
	b.ReportAllocs()
	b.SetBytes(int64(len(source)))
	b.ReportMetric(float64(expected), "diagnostics/op")
	for b.Loop() {
		run()
		if count != expected {
			b.Fatalf("diagnostic count changed: got %d, want %d", count, expected)
		}
	}
}

func lintBenchmarkDiagnosticKey(name string, diagnostic *ast.Diagnostic) string {
	var out strings.Builder
	fmt.Fprintf(&out, "%s:%d:%d:%d:%s:%q:%q", name, diagnostic.Pos(), diagnostic.End(), diagnostic.Code(), diagnostic.MessageKey(), diagnostic.MessageText(), diagnostic.MessageArgs())
	for index, actions := range [][]*ast.CodeFixAction{diagnostic.CodeFixes(), diagnostic.CodeFixSuggestions()} {
		var keys []string
		for _, action := range actions {
			var edits strings.Builder
			fmt.Fprintf(&edits, "%d:%s:%s:%s:%q", index, action.FixName, action.FixID, action.Description.MessageKey(), action.Description.MessageArgs())
			for _, file := range action.Changes {
				fmt.Fprintf(&edits, ":%s:%t", file.FileName, file.IsNewFile)
				for _, edit := range file.TextChanges {
					fmt.Fprintf(&edits, ":%d:%d:%q", edit.Pos(), edit.End(), edit.NewText)
				}
			}
			keys = append(keys, edits.String())
		}
		slices.Sort(keys)
		fmt.Fprintf(&out, ":%q", keys)
	}
	return out.String()
}
