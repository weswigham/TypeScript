//// [tests/cases/conformance/lint/rules/prefer-named-capture-group/lintPreferNamedCaptureGroupRolloutRegexRulesConstReAWordBCURegExpD.ts] ////

//// [input.ts]
const re = /(a)(?<word>b)(?:c)/u; RegExp("(d)");

//// [input.ts]
const re = /(a)(?<word>b)(?:c)/u; RegExp("(d)");
