//// [tests/cases/conformance/lint/rules/prefer-object-spread/lintPreferObjectSpreadRolloutDeclarationsSpreadOneGetter.ts] ////

//// [input.ts]
const o = Object.assign({get x() {}});

//// [input.ts]
const o = {get x() {}};
