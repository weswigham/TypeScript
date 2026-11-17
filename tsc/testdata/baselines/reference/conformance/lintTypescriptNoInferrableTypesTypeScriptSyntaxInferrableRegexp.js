//// [tests/cases/conformance/lint/rules/no-inferrable-types/lintTypescriptNoInferrableTypesTypeScriptSyntaxInferrableRegexp.ts] ////

//// [input.ts]
const a: RegExp = /a/; const b: RegExp = new RegExp('b');

//// [input.ts]
const a = /a/; const b = new RegExp('b');
