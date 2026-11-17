//// [tests/cases/conformance/lint/rules/prefer-regex-literals/rolloutPreferRegexLiteralsRegexConstructors.ts] ////

//// [input.ts]
const first = new RegExp("abc", "u");
const second = RegExp(`def`);
const third = RegExp(String.raw`\w+`);
const dynamic = RegExp(pattern);
function shadowed(RegExp: Function) { return RegExp("abc"); }

//// [input.ts]
const first = new RegExp("abc", "u");
const second = RegExp(`def`);
const third = RegExp(String.raw`\w+`);
const dynamic = RegExp(pattern);
function shadowed(RegExp: Function) { return RegExp("abc"); }
