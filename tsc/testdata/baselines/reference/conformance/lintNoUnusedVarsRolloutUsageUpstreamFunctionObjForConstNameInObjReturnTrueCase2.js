//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamFunctionObjForConstNameInObjReturnTrueCase2.ts] ////

//// [globals.d.ts]

//// [input.ts]
(function(obj) { for ( const name in obj ) return true })({})

//// [input.ts]
(function(obj) { for ( const name in obj ) return true })({})
