//// [tests/cases/conformance/lint/rules/adjacent-overload-signatures/lintTypescriptAdjacentOverloadSignaturesTypeScriptSyntaxAdjacentConstructNameCollision.ts] ////

//// [input.ts]
interface I { new(): I; 'new'(): void; new(a: number): I; }

//// [input.ts]
interface I { new(): I; 'new'(): void; new(a: number): I; }
