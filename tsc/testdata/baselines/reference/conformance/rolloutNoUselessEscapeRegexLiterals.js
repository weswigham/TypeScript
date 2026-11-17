//// [tests/cases/conformance/lint/rules/no-useless-escape/rolloutNoUselessEscapeRegexLiterals.ts] ////

//// [input.ts]
const identity = /\a\-/;
const edges = /[\-a\^]/;
const safe = /[\^a][a\-z][\&&]/v;
const text = "\a";
const template = `\$name`;
const raw = String.raw`\a`;

//// [input.ts]
const identity = /\a\-/;
const edges = /[\-a\^]/;
const safe = /[\^a][a\-z][\&&]/v;
const text = "\a";
const template = `\$name`;
const raw = String.raw`\a`;
