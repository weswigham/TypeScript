//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamFunctionObjForLetNameInObjReturnTrueCase1.ts] ////

//// [globals.d.ts]

//// [input.ts]
(function(obj) { for ( let name in obj ) { return true } })({})

//// [input.ts]
(function(obj) { for ( let name in obj ) { return true } })({})
