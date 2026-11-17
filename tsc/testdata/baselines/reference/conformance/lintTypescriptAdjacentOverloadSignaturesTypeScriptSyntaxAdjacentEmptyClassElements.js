//// [tests/cases/conformance/lint/rules/adjacent-overload-signatures/lintTypescriptAdjacentOverloadSignaturesTypeScriptSyntaxAdjacentEmptyClassElements.ts] ////

//// [input.ts]
class C { f(a: string): void; ; f(a: number): void; }

//// [input.ts]
class C { f(a: string): void; ; f(a: number): void; }
