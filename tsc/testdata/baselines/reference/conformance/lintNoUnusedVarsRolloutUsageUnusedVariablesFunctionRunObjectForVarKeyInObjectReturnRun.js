//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUnusedVariablesFunctionRunObjectForVarKeyInObjectReturnRun.ts] ////

//// [globals.d.ts]

//// [input.ts]
function run(object) { for (var key in object) return; } run({});

//// [input.ts]
function run(object) { for (var key in object) return; } run({});
