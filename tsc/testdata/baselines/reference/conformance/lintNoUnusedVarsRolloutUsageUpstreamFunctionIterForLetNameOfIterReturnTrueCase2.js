//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamFunctionIterForLetNameOfIterReturnTrueCase2.ts] ////

//// [globals.d.ts]

//// [input.ts]
(function(iter) { for ( let name of iter ) return true })({})

//// [input.ts]
(function(iter) { for ( let name of iter ) return true })({})
