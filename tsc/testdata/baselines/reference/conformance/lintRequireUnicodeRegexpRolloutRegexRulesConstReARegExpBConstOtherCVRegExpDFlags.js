//// [tests/cases/conformance/lint/rules/require-unicode-regexp/lintRequireUnicodeRegexpRolloutRegexRulesConstReARegExpBConstOtherCVRegExpDFlags.ts] ////

//// [input.ts]
const re = /a/; RegExp("b"); const other = /c/v; RegExp("d", flags);

//// [input.ts]
const re = /a/; RegExp("b"); const other = /c/v; RegExp("d", flags);
