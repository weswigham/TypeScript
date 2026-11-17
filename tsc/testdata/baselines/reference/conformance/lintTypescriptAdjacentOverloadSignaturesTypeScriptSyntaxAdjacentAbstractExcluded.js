//// [tests/cases/conformance/lint/rules/adjacent-overload-signatures/lintTypescriptAdjacentOverloadSignaturesTypeScriptSyntaxAdjacentAbstractExcluded.ts] ////

//// [input.ts]
abstract class C { abstract f(a: string): void; property: number; abstract f(a: number): void; }

//// [input.ts]
abstract class C { abstract f(a: string): void; property: number; abstract f(a: number): void; }
