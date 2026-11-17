//// [tests/cases/conformance/lint/rules/no-useless-backreference/lintNoUselessBackreferenceRolloutRegexRulesConstReA1ConstBack1A.ts] ////

//// [input.ts]
const re = /(a)\1/; const back = /(?<=\1(a))/;

//// [input.ts]
const re = /(a)\1/; const back = /(?<=\1(a))/;
