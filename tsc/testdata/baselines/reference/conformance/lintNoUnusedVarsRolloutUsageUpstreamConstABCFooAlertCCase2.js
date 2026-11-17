//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamConstABCFooAlertCCase2.ts] ////

//// [globals.d.ts]

//// [input.ts]
const { a: [{ b }], c} = foo; alert(c);

//// [input.ts]
const { a: [{ b }], c} = foo; alert(c);
