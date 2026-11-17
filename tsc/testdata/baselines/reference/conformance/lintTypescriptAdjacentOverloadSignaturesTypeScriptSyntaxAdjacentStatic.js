//// [tests/cases/conformance/lint/rules/adjacent-overload-signatures/lintTypescriptAdjacentOverloadSignaturesTypeScriptSyntaxAdjacentStatic.ts] ////

//// [input.ts]
class C { static f(a: string); f() {} static f(a: number); }

//// [input.ts]
class C { static f(a: string); f() {} static f(a: number); }
