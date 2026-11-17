//// [tests/cases/conformance/lint/rules/prefer-object-spread/lintPreferObjectSpreadRolloutDeclarationsSpreadAlias.ts] ////

//// [input.ts]
const assign = Object.assign; const o = assign({}, source);

//// [input.ts]
const assign = Object.assign; const o = { ...source};
