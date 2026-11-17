//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUnusedVariablesFunctionRunFirst1SecondReturnSecondRun.ts] ////

//// [globals.d.ts]

//// [input.ts]
function run(first = 1, second) { return second; } run();

//// [input.ts]
function run(first = 1, second) { return second; } run();
