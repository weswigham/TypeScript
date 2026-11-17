//// [tests/cases/conformance/lint/rules/prefer-const/lintPreferConstRolloutDeclarationsConstPatternNested.ts] ////

//// [input.ts]
let {a: {x, y}} = obj;

//// [input.ts]
const {a: {x, y}} = obj;
