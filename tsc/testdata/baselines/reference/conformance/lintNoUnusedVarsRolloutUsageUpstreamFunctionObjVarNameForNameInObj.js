//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamFunctionObjVarNameForNameInObj.ts] ////

//// [globals.d.ts]

//// [input.ts]
(function(obj) { var name; for ( name in obj ) { } })({});

//// [input.ts]
(function(obj) { var name; for ( name in obj ) { } })({});
