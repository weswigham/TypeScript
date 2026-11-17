//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamConstCABFooAlertC.ts] ////

//// [globals.d.ts]

//// [input.ts]
const { c, a: { b } } = foo; alert(c);

//// [input.ts]
const { c, a: { b } } = foo; alert(c);
