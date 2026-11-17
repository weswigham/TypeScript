//// [tests/cases/conformance/lint/rules/no-regex-spaces/lintNoRegexSpacesRolloutRegexRulesConstReABRegExpCD.ts] ////

//// [input.ts]
const re = /a   b/; RegExp("c  d");

//// [input.ts]
const re = /a {3}b/; RegExp("c {2}d");
