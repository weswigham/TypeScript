//// [tests/cases/conformance/lint/rules/adjacent-overload-signatures/lintTypescriptAdjacentOverloadSignaturesTypeScriptSyntaxAdjacentValid.ts] ////

//// [input.ts]
function f(a: string); function f(a: number); function f(a: unknown) {}

//// [input.ts]
function f(a: string); function f(a: number); function f(a: unknown) {}
