//// [tests/cases/conformance/lint/rules/prefer-string-starts-ends-with/lintTypescriptPreferStringStartsEndsWithFinalLibraryCasesDeclareConstTextStringTextSlice2Ab.ts] ////

//// [input.ts]
declare const text: string; text.slice(-2) !== 'ab';

//// [input.ts]
declare const text: string; !text.endsWith('ab');
