//// [tests/cases/conformance/lint/rules/prefer-named-capture-group/rolloutPreferNamedCaptureGroupRegexLiterals.ts] ////

//// [input.ts]
const unnamed = /(a)(b)/;
const named = /(?<word>a)(?:b)/u;
RegExp("(c)");
new RegExp(String.raw`(\w)`);

//// [input.ts]
const unnamed = /(a)(b)/;
const named = /(?<word>a)(?:b)/u;
RegExp("(c)");
new RegExp(String.raw`(\w)`);
