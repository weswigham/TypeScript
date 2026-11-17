//// [tests/cases/conformance/lint/rules/prefer-string-starts-ends-with/lintTypescriptPreferStringStartsEndsWithFinalLibraryCasesDeclareConstTextStringTextMatchAbNull.ts] ////

//// [input.ts]
declare const text: string; text.match(/^ab/) === null;

//// [input.ts]
declare const text: string; !text.startsWith("ab");
