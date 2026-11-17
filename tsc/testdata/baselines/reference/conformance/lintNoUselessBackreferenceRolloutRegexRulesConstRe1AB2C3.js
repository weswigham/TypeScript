//// [tests/cases/conformance/lint/rules/no-useless-backreference/lintNoUselessBackreferenceRolloutRegexRulesConstRe1AB2C3.ts] ////

//// [input.ts]
const re = /\1(a)|(b\2)|(?!(c))\3/;

//// [input.ts]
const re = /\1(a)|(b\2)|(?!(c))\3/;
