//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamFunctionIterVarNameForNameOfIterIReturn.ts] ////

//// [globals.d.ts]

//// [input.ts]
(function(iter) { var name; for ( name of iter ) { i(); return; } })({});

//// [input.ts]
(function(iter) { var name; for ( name of iter ) { i(); return; } })({});
