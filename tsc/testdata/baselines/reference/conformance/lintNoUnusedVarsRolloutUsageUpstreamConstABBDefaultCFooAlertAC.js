//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamConstABBDefaultCFooAlertAC.ts] ////

//// [globals.d.ts]

//// [input.ts]
const { a, b = bDefault, c } = foo; alert(a + c);

//// [input.ts]
const { a, b = bDefault, c } = foo; alert(a + c);
