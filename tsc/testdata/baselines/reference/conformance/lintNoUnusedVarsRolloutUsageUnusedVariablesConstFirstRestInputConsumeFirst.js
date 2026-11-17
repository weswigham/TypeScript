//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUnusedVariablesConstFirstRestInputConsumeFirst.ts] ////

//// [globals.d.ts]

//// [input.ts]
const { first, ...rest } = input; consume(first);

//// [input.ts]
const { first, ...rest } = input; consume(first);
