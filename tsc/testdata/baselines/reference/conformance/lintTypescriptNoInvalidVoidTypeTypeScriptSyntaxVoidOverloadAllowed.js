//// [tests/cases/conformance/lint/rules/no-invalid-void-type/lintTypescriptNoInvalidVoidTypeTypeScriptSyntaxVoidOverloadAllowed.ts] ////

//// [input.ts]
function f(): void; function f(x?: string): string | void {}

//// [input.ts]
function f(): void; function f(x?: string): string | void {}
