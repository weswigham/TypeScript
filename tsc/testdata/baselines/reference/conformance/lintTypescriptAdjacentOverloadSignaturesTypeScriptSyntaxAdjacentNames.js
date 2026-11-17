//// [tests/cases/conformance/lint/rules/adjacent-overload-signatures/lintTypescriptAdjacentOverloadSignaturesTypeScriptSyntaxAdjacentNames.ts] ////

//// [input.ts]
interface I { f(a: string): void; ['f'](a: number): void; [f](a: boolean): void; }

//// [input.ts]
interface I { f(a: string): void; ['f'](a: number): void; [f](a: boolean): void; }
