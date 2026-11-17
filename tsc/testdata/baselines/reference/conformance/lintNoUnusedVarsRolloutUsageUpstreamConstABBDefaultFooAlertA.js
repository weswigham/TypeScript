//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamConstABBDefaultFooAlertA.ts] ////

//// [globals.d.ts]

//// [input.ts]
const { a, b = bDefault } = foo; alert(a);

//// [input.ts]
const { a, b = bDefault } = foo; alert(a);
