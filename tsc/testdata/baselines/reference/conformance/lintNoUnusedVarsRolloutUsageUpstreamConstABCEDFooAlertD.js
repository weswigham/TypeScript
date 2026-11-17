//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamConstABCEDFooAlertD.ts] ////

//// [globals.d.ts]

//// [input.ts]
const { a: { b: { c: { e } }, d } } = foo; alert(d);

//// [input.ts]
const { a: { b: { c: { e } }, d } } = foo; alert(d);
