//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamFunctionBazXBFooFooBazCase1.ts] ////

//// [globals.d.ts]

//// [input.ts]
function baz([{x: [_b, foo]}]) {foo};
baz()

//// [input.ts]
function baz([{x: [_b, foo]}]) {foo};
baz()
