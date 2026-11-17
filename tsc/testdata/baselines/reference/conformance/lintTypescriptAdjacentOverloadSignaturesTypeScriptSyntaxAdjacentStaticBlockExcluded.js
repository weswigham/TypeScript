//// [tests/cases/conformance/lint/rules/adjacent-overload-signatures/lintTypescriptAdjacentOverloadSignaturesTypeScriptSyntaxAdjacentStaticBlockExcluded.ts] ////

//// [input.ts]
class C { static { function f(a: string); const gap = 1; function f(a: number); } }

//// [input.ts]
class C { static { function f(a: string); const gap = 1; function f(a: number); } }
