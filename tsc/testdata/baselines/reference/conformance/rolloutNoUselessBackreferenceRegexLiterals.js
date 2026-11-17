//// [tests/cases/conformance/lint/rules/no-useless-backreference/rolloutNoUselessBackreferenceRegexLiterals.ts] ////

//// [input.ts]
const forward = /\1(a)/;
const nested = /(a\1)/;
const disjunctive = /(a)|\1/;
const negative = /(?!(a))\1/;
const backward = /(?<=(a)\1)/;
const useful = /(a)\1/;
const names = /(?<word>a)|(?<word>b)\k<word>/u;

//// [input.ts]
const forward = /\1(a)/;
const nested = /(a\1)/;
const disjunctive = /(a)|\1/;
const negative = /(?!(a))\1/;
const backward = /(?<=(a)\1)/;
const useful = /(a)\1/;
const names = /(?<word>a)|(?<word>b)\k<word>/u;
