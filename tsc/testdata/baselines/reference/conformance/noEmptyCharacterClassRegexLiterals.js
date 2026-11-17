//// [tests/cases/conformance/lint/rules/no-empty-character-class/noEmptyCharacterClassRegexLiterals.ts] ////

//// [input.ts]
const empty = /^abc[]/;
const escapedPrefix = /\[[]/;
const negated = /[^]/;
const escaped = /\[]/;
const literalBracket = /[[]/;
const nested = /[[a][]]/v;
const intersection = /[a&&[]]/v;
const subtraction = /[a--[]]/v;
const emptyString = /[\q{}]/v;
const legacyEscape = /\1[]/;
const identityEscape = /\k<[]>/;
const constructor = new RegExp("[]");

//// [input.ts]
const empty = /^abc[]/;
const escapedPrefix = /\[[]/;
const negated = /[^]/;
const escaped = /\[]/;
const literalBracket = /[[]/;
const nested = /[[a][]]/v;
const intersection = /[a&&[]]/v;
const subtraction = /[a--[]]/v;
const emptyString = /[\q{}]/v;
const legacyEscape = /\1[]/;
const identityEscape = /\k<[]>/;
const constructor = new RegExp("[]");
