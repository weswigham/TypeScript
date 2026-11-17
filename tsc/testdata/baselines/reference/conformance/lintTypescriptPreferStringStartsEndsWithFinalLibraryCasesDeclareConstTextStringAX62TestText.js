//// [tests/cases/conformance/lint/rules/prefer-string-starts-ends-with/lintTypescriptPreferStringStartsEndsWithFinalLibraryCasesDeclareConstTextStringAX62TestText.ts] ////

//// [input.ts]
declare const text: string; /^a\x62/.test(text);

//// [input.ts]
declare const text: string; text.startsWith("ab");
