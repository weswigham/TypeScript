//// [tests/cases/conformance/lint/rules/no-div-regex/noDivRegexRegexLiterals.ts] ////

//// [input.ts]
const ambiguous = /=foo/;
const flags = /=foo/giu;
const comment = /* keep */ /=/;
const escaped = /\=foo/;
const normal = /foo/;
const characterClass = /[=]foo/;
const constructor = new RegExp("=foo");

//// [input.ts]
const ambiguous = /[=]foo/;
const flags = /[=]foo/giu;
const comment = /* keep */ /[=]/;
const escaped = /\=foo/;
const normal = /foo/;
const characterClass = /[=]foo/;
const constructor = new RegExp("=foo");
