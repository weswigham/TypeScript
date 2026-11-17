//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamFunctionObjForVarNameInObjReturnTrueCase1.ts] ////

//// [globals.d.ts]

//// [input.ts]
(function(obj) { for ( var name in obj ) { return true } })({})

//// [input.ts]
(function(obj) { for ( var name in obj ) { return true } })({})
