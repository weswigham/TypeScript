//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamConstABCDFooAlertD.ts] ////

//// [globals.d.ts]

//// [input.ts]
const { a: { b: { c }, d } } = foo; alert(d);

//// [input.ts]
const { a: { b: { c }, d } } = foo; alert(d);
