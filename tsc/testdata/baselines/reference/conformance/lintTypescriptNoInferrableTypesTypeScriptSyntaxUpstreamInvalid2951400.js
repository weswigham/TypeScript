//// [tests/cases/conformance/lint/rules/no-inferrable-types/lintTypescriptNoInferrableTypesTypeScriptSyntaxUpstreamInvalid2951400.ts] ////

//// [input.ts]
const fn = (a: number = 5, b: boolean = true, c: string = 'foo') => {};

//// [input.ts]
const fn = (a = 5, b = true, c = 'foo') => {};
