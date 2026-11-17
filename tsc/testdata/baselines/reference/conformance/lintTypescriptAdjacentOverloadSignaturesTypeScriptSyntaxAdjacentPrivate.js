//// [tests/cases/conformance/lint/rules/adjacent-overload-signatures/lintTypescriptAdjacentOverloadSignaturesTypeScriptSyntaxAdjacentPrivate.ts] ////

//// [input.ts]
class C { #f(): void; '#f'(): void; #f(a: number): void; '#f'(a: number): void; }

//// [input.ts]
class C { #f(): void; '#f'(): void; #f(a: number): void; '#f'(a: number): void; }
