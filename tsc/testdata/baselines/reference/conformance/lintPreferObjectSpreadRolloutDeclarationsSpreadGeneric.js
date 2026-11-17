//// [tests/cases/conformance/lint/rules/prefer-object-spread/lintPreferObjectSpreadRolloutDeclarationsSpreadGeneric.ts] ////

//// [input.ts]
const o = Object.assign<{}, () => void>({}, source);

//// [input.ts]
const o = { ...source};
