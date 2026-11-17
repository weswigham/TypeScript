package helpers_test

import (
	"testing"

	"github.com/microsoft/TypeScript/tsc/internal/ast"
	"github.com/microsoft/TypeScript/tsc/internal/binder"
	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/lint/rules/helpers"
	"github.com/microsoft/TypeScript/tsc/internal/parser"
)

func TestReturnCompletion(t *testing.T) {
	t.Parallel()

	for _, test := range []struct {
		source string
		normal bool
		kind   helpers.ReturnCompletionKind
	}{
		{"if (ready) return 1;", true, helpers.CompletionReturn},
		{"if (ready) return 1; else throw error;", false, helpers.CompletionReturn},
		{"try { return 1; } finally { work(); }", false, helpers.CompletionReturn},
		{"try { return 1; } finally { throw error; }", false, helpers.CompletionThrow},
		{"try { throw error; } catch { work(); }", true, helpers.CompletionNormal},
		{"try { return 1; } catch { work(); }", false, helpers.CompletionReturn},
		{"try { return value; } catch { work(); }", true, helpers.CompletionReturn},
		{"while (true) { continue; }", false, helpers.CompletionNormal},
		{"while (true) { if (ready) break; }", true, helpers.CompletionNormal},
		{"while (false) { return 1; }", true, helpers.CompletionNormal},
		{"while (1) { continue; }", false, helpers.CompletionNormal},
		{"while ('') { return 1; }", true, helpers.CompletionNormal},
		{"while (0n) { return 1; }", true, helpers.CompletionNormal},
		{"while (0b0n) { return 1; }", true, helpers.CompletionNormal},
		{"while (0o0n) { return 1; }", true, helpers.CompletionNormal},
		{"while (0x0n) { return 1; }", true, helpers.CompletionNormal},
		{"while (0xffn) { continue; }", false, helpers.CompletionNormal},
		{"do { return 1; } while (ready);", false, helpers.CompletionReturn},
		{"for (;;) { return 1; }", false, helpers.CompletionReturn},
		{"for (const value of values) { return 1; }", true, helpers.CompletionReturn},
		{"outer: for (;;) { while (true) { break outer; } }", true, helpers.CompletionNormal},
		{"outer: for (;;) { while (true) { continue outer; } }", false, helpers.CompletionNormal},
		{"outer: inner: do { continue outer; } while (false);", true, helpers.CompletionNormal},
		{"switch (value) { case 1: work(); default: return 1; }", false, helpers.CompletionReturn},
		{"switch (value) { case 1: return 1; }", true, helpers.CompletionReturn},
		{"function nested() { return 1; }", true, helpers.CompletionNormal},
		{"return 1; work();", false, helpers.CompletionReturn},
		{"try { for (;;) { break; } } catch { return 1; }", true, helpers.CompletionNormal},
		{"if (true) return 1;", true, helpers.CompletionReturn},
		{"(() => { throw error; })(); return 1;", false, helpers.CompletionReturn},
		{"class C { static { throw error; } } return 1;", false, helpers.CompletionReturn},
	} {
		t.Run(test.source, func(t *testing.T) {
			t.Parallel()

			for _, bound := range []bool{false, true} {
				file := parser.ParseSourceFile(ast.SourceFileParseOptions{FileName: "/input.ts"}, "function test() {"+test.source+"}", core.ScriptKindTS)
				if len(file.Diagnostics()) != 0 {
					t.Fatal(file.Diagnostics())
				}
				if bound {
					binder.BindSourceFile(file)
				}
				flow := &helpers.ReturnFlowAnalysis{Reachable: make(map[*ast.Node]bool)}
				result := flow.Statement(file.Statements.Nodes[0].Body(), nil)
				if helpers.CompletionHasNormal(result) != test.normal {
					t.Fatalf("normal=%v, want %v: %v", helpers.CompletionHasNormal(result), test.normal, result)
				}
				if test.kind != helpers.CompletionNormal {
					found := false
					for _, completion := range result {
						found = found || completion.Kind == test.kind
					}
					if !found {
						t.Fatalf("missing completion kind %d: %v", test.kind, result)
					}
				}
			}
		})
	}
}
