//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUnusedVariablesConstFirstSecondInputConsumeSecond.ts] ////

//// [globals.d.ts]

//// [input.ts]
const [_first, second] = input; consume(second);

//// [input.ts]
const [_first, second] = input; consume(second);
