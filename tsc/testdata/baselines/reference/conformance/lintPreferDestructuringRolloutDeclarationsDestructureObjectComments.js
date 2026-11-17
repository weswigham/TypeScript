//// [tests/cases/conformance/lint/rules/prefer-destructuring/lintPreferDestructuringRolloutDeclarationsDestructureObjectComments.ts] ////

//// [input.ts]
const x = obj(/* keep */).x;

//// [input.ts]
const {x} = obj(/* keep */);
