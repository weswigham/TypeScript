//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamFunctionIterVarNameForNameOfIter.ts] ////

//// [globals.d.ts]

//// [input.ts]
(function(iter) { var name; for ( name of iter ) { } })({});

//// [input.ts]
(function(iter) { var name; for ( name of iter ) { } })({});
