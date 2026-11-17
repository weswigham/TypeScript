//// [tests/cases/conformance/lint/rules/no-inferrable-types/lintTypescriptNoInferrableTypesTypeScriptSyntaxInferrableParenthesizedCallee.ts] ////

//// [input.ts]
let value: number = (Number)('1');

//// [input.ts]
let value = (Number)('1');
