//// [tests/cases/conformance/lint/rules/prefer-object-spread/lintPreferObjectSpreadRolloutDeclarationsSpreadParens.ts] ////

//// [input.ts]
const o = Object.assign(({}), (source));

//// [input.ts]
const o = { ...(source)};
