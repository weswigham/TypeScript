//// [tests/cases/conformance/lint/rules/prefer-object-spread/lintPreferObjectSpreadRolloutDeclarationsSpreadTrailingComma.ts] ////

//// [input.ts]
const o = Object.assign({x: 1, /* keep */}, source);

//// [input.ts]
const o = {x: 1, /* keep */ ...source};
