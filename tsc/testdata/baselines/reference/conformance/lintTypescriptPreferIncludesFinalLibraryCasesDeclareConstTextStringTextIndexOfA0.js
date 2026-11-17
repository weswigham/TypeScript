//// [tests/cases/conformance/lint/rules/prefer-includes/lintTypescriptPreferIncludesFinalLibraryCasesDeclareConstTextStringTextIndexOfA0.ts] ////

//// [input.ts]
declare const text: string; text.indexOf('a') < 0;

//// [input.ts]
declare const text: string; !text.includes('a');
