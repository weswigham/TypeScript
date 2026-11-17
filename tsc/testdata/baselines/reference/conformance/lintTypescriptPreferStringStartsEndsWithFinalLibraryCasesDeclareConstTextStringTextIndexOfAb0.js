//// [tests/cases/conformance/lint/rules/prefer-string-starts-ends-with/lintTypescriptPreferStringStartsEndsWithFinalLibraryCasesDeclareConstTextStringTextIndexOfAb0.ts] ////

//// [input.ts]
declare const text: string; text.indexOf('ab') === 0;

//// [input.ts]
declare const text: string; text.startsWith('ab');
