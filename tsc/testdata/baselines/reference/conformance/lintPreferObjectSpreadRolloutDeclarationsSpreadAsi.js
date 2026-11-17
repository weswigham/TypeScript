//// [tests/cases/conformance/lint/rules/prefer-object-spread/lintPreferObjectSpreadRolloutDeclarationsSpreadAsi.ts] ////

//// [input.ts]
foo()
Object.assign({}, source);

//// [input.ts]
foo()
;({ ...source});
