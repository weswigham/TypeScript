//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamFunctionIterForVarNameOfIter.ts] ////

//// [globals.d.ts]

//// [input.ts]
(function(iter) { for ( var name of iter ) { } })({});

//// [input.ts]
(function(iter) { for ( var name of iter ) { } })({});
