//// [tests/cases/conformance/lint/rules/adjacent-overload-signatures/lintTypescriptAdjacentOverloadSignaturesTypeScriptSyntaxAdjacentNamespace.ts] ////

//// [input.ts]
namespace N { export function f(a: string); const gap = 1; export function f(a: number); }

//// [input.ts]
namespace N { export function f(a: string); const gap = 1; export function f(a: number); }
