//// [tests/cases/conformance/lint/rules/adjacent-overload-signatures/lintTypescriptAdjacentOverloadSignaturesTypeScriptSyntaxAdjacentCall.ts] ////

//// [input.ts]
interface I { (): void; call(): void; (a: number): void; }

//// [input.ts]
interface I { (): void; call(): void; (a: number): void; }
