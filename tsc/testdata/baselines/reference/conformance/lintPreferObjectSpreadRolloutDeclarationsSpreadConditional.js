//// [tests/cases/conformance/lint/rules/prefer-object-spread/lintPreferObjectSpreadRolloutDeclarationsSpreadConditional.ts] ////

//// [input.ts]
const o = Object.assign({}, ok ? a : b);

//// [input.ts]
const o = { ...(ok ? a : b)};
