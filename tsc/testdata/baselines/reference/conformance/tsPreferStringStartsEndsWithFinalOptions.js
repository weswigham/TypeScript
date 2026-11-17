//// [tests/cases/conformance/lint/rules/prefer-string-starts-ends-with/tsPreferStringStartsEndsWithFinalOptions.ts] ////

//// [input.ts]
declare const text: string;
text[0] === "a";
text.charAt(0) === "a";
text[text.length - 1] === "a";
text.indexOf("ab") === 0;
text.slice(-2) === "ab";

//// [input.ts]
declare const text: string;
text[0] === "a";
text.charAt(0) === "a";
text[text.length - 1] === "a";
text.startsWith("ab");
text.endsWith("ab");
