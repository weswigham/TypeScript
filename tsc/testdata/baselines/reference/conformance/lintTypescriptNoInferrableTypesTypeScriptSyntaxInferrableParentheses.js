//// [tests/cases/conformance/lint/rules/no-inferrable-types/lintTypescriptNoInferrableTypesTypeScriptSyntaxInferrableParentheses.ts] ////

//// [input.ts]
let value: (number) = (Number?.('1'));

//// [input.ts]
let value = (Number?.('1'));
