//// [tests/cases/conformance/lint/rules/no-control-regex/rolloutNoControlRegexRegexLiterals.ts] ////

//// [input.ts]
const escaped = /\x00\u001f/;
const conventional = /\n\t\cA/;
const unicodeSets = /[\q{\x01|ab}]/v;
RegExp("\\x02");
function shadowed(RegExp: Function) { RegExp("\\x03"); }

//// [input.ts]
const escaped = /\x00\u001f/;
const conventional = /\n\t\cA/;
const unicodeSets = /[\q{\x01|ab}]/v;
RegExp("\\x02");
function shadowed(RegExp: Function) { RegExp("\\x03"); }
