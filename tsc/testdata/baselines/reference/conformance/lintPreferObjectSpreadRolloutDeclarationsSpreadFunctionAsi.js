//// [tests/cases/conformance/lint/rules/prefer-object-spread/lintPreferObjectSpreadRolloutDeclarationsSpreadFunctionAsi.ts] ////

//// [input.ts]
const f = function() {}
Object.assign({}, source);

//// [input.ts]
const f = function() {}
;({ ...source});
