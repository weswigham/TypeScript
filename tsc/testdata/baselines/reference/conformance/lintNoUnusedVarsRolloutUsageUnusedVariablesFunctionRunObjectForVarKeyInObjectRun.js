//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUnusedVariablesFunctionRunObjectForVarKeyInObjectRun.ts] ////

//// [globals.d.ts]

//// [input.ts]
function run(object) { for (var key in object) {} } run({});

//// [input.ts]
function run(object) { for (var key in object) {} } run({});
