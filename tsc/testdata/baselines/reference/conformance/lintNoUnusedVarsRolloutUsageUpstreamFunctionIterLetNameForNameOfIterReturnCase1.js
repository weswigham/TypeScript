//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamFunctionIterLetNameForNameOfIterReturnCase1.ts] ////

//// [globals.d.ts]

//// [input.ts]
(function(iter) { let name; for ( name of iter ) { return; } })({});

//// [input.ts]
(function(iter) { let name; for ( name of iter ) { return; } })({});
