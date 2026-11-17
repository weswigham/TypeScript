//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamFunctionObjVarNameForNameInObjReturnCase1.ts] ////

//// [globals.d.ts]

//// [input.ts]
(function(obj) { var name; for ( name in obj ) { return; } })({});

//// [input.ts]
(function(obj) { var name; for ( name in obj ) { return; } })({});
