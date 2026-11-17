//// [tests/cases/conformance/lint/rules/no-regex-spaces/rolloutNoRegexSpacesRegexLiterals.ts] ////

//// [input.ts]
const repeated = /a   b/;
const quantified = /a   +/;
const safe = /[  ]/;
const sets = /[[  ]--[a]]/v;
new RegExp("c  d");
RegExp("\\d  x");

//// [input.ts]
const repeated = /a {3}b/;
const quantified = /a {2} +/;
const safe = /[  ]/;
const sets = /[[  ]--[a]]/v;
new RegExp("c {2}d");
RegExp("\\d  x");
