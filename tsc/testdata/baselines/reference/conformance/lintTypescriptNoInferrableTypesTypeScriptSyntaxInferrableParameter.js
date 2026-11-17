//// [tests/cases/conformance/lint/rules/no-inferrable-types/lintTypescriptNoInferrableTypesTypeScriptSyntaxInferrableParameter.ts] ////

//// [input.ts]
const fn = (value?: number = 1) => value;

//// [input.ts]
const fn = (value = 1) => value;
