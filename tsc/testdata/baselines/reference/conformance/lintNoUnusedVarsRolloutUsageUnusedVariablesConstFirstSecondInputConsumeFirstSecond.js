//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUnusedVariablesConstFirstSecondInputConsumeFirstSecond.ts] ////

//// [globals.d.ts]

//// [input.ts]
const [_first, second] = input; consume(_first, second);

//// [input.ts]
const [_first, second] = input; consume(_first, second);
