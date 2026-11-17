//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamFunctionObjLetNameForNameInObjReturnCase2.ts] ////

//// [globals.d.ts]

//// [input.ts]
(function(obj) { let name; for ( name in obj ) return; })({});

//// [input.ts]
(function(obj) { let name; for ( name in obj ) return; })({});
