//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamFunctionObjVarNameForNameInObjIReturn.ts] ////

//// [globals.d.ts]

//// [input.ts]
(function(obj) { var name; for ( name in obj ) { i(); return; } })({});

//// [input.ts]
(function(obj) { var name; for ( name in obj ) { i(); return; } })({});
