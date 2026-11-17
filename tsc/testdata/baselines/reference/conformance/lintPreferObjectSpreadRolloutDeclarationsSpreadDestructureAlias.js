//// [tests/cases/conformance/lint/rules/prefer-object-spread/lintPreferObjectSpreadRolloutDeclarationsSpreadDestructureAlias.ts] ////

//// [input.ts]
const {assign} = Object; const o = assign({}, source);

//// [input.ts]
const {assign} = Object; const o = { ...source};
