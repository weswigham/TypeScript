//// [tests/cases/conformance/lint/rules/prefer-string-starts-ends-with/lintTypescriptPreferStringStartsEndsWithFinalLibraryCasesDeclareConstTextStringText0A.ts] ////

//// [input.ts]
declare const text: string; text[0] !== 'a';

//// [input.ts]
declare const text: string; !text.startsWith('a');
