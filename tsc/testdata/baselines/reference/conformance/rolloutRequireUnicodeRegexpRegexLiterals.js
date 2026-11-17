//// [tests/cases/conformance/lint/rules/require-unicode-regexp/rolloutRequireUnicodeRegexpRegexLiterals.ts] ////

//// [input.ts]
const legacy = /a/;
const unicode = /b/u;
const sets = /[[a-z]--[aeiou]]/v;
RegExp("c");
new RegExp("d", "g");
RegExp("e", flags);

//// [input.ts]
const legacy = /a/;
const unicode = /b/u;
const sets = /[[a-z]--[aeiou]]/v;
RegExp("c");
new RegExp("d", "g");
RegExp("e", flags);
