//// [tests/cases/conformance/lint/rules/prefer-object-spread/lintPreferObjectSpreadRolloutDeclarationsSpreadMerge.ts] ////

//// [input.ts]
const o = Object.assign({ x: 1 }, { y: 2 }, source);

//// [input.ts]
const o = {x: 1, y: 2, ...source};
