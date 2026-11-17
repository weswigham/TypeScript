//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUnusedVariablesFunctionRecurseReturnRecurse.ts] ////

//// [globals.d.ts]

//// [input.ts]
function recurse() { return recurse(); }

//// [input.ts]
function recurse() { return recurse(); }
