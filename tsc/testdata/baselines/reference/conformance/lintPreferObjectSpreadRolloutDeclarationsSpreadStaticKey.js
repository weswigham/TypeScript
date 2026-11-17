//// [tests/cases/conformance/lint/rules/prefer-object-spread/lintPreferObjectSpreadRolloutDeclarationsSpreadStaticKey.ts] ////

//// [input.ts]
const o = Object['assign']({}, source);

//// [input.ts]
const o = { ...source};
