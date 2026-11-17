//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamFunctionObjForVarNameInObj.ts] ////

//// [globals.d.ts]

//// [input.ts]
(function(obj) { for ( var name in obj ) { } })({});

//// [input.ts]
(function(obj) { for ( var name in obj ) { } })({});
