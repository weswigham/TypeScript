//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamFunctionIterForConstNameOfIterReturnTrueCase2.ts] ////

//// [globals.d.ts]

//// [input.ts]
(function(iter) { for ( const name of iter ) return true })({})

//// [input.ts]
(function(iter) { for ( const name of iter ) return true })({})
