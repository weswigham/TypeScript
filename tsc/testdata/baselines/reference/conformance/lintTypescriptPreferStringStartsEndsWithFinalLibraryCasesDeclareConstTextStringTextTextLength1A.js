//// [tests/cases/conformance/lint/rules/prefer-string-starts-ends-with/lintTypescriptPreferStringStartsEndsWithFinalLibraryCasesDeclareConstTextStringTextTextLength1A.ts] ////

//// [input.ts]
declare const text: string; text[text.length - 1] === 'a';

//// [input.ts]
declare const text: string; text.endsWith('a');
