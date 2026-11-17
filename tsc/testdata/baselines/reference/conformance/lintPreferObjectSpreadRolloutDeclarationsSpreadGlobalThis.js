//// [tests/cases/conformance/lint/rules/prefer-object-spread/lintPreferObjectSpreadRolloutDeclarationsSpreadGlobalThis.ts] ////

//// [input.ts]
const o = globalThis.Object.assign({}, source);

//// [input.ts]
const o = { ...source};
