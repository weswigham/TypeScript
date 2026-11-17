//// [tests/cases/conformance/lint/rules/prefer-string-starts-ends-with/lintTypescriptPreferStringStartsEndsWithFinalLibraryCasesDeclareConstTextStringTextSlice02Ab.ts] ////

//// [input.ts]
declare const text: string; text.slice(0, 2) === 'ab';

//// [input.ts]
declare const text: string; text.startsWith('ab');
