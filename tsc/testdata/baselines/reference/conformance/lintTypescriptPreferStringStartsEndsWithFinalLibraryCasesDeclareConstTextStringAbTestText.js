//// [tests/cases/conformance/lint/rules/prefer-string-starts-ends-with/lintTypescriptPreferStringStartsEndsWithFinalLibraryCasesDeclareConstTextStringAbTestText.ts] ////

//// [input.ts]
declare const text: string; /ab$/.test(text);

//// [input.ts]
declare const text: string; text.endsWith("ab");
