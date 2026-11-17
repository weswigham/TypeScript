//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUnusedVariablesConstRecurseRecurse.ts] ////

//// [globals.d.ts]

//// [input.ts]
const recurse = () => () => recurse();

//// [input.ts]
const recurse = () => () => recurse();
