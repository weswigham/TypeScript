//// [tests/cases/conformance/lint/rules/prefer-destructuring/lintPreferDestructuringRolloutDeclarationsDestructureScopedOptions.ts] ////

//// [input.ts]
const x = obj.x; x = obj.x;

//// [input.ts]
const {x} = obj; x = obj.x;
