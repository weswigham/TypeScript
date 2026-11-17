//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUnusedVariablesConstFirstRestInputConsumeRest.ts] ////

//// [globals.d.ts]

//// [input.ts]
const { first, ...rest } = input; consume(rest);

//// [input.ts]
const { first, ...rest } = input; consume(rest);
