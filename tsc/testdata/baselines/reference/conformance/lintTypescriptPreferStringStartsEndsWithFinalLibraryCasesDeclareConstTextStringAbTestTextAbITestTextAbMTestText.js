//// [tests/cases/conformance/lint/rules/prefer-string-starts-ends-with/lintTypescriptPreferStringStartsEndsWithFinalLibraryCasesDeclareConstTextStringAbTestTextAbITestTextAbMTestText.ts] ////

//// [input.ts]
declare const text: string; /^ab$/.test(text); /^ab/i.test(text); /^ab/m.test(text); /^a|b/.test(text);

//// [input.ts]
declare const text: string; /^ab$/.test(text); /^ab/i.test(text); /^ab/m.test(text); /^a|b/.test(text);
