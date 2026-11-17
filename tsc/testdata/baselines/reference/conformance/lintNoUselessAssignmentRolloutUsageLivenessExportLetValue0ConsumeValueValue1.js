//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageLivenessExportLetValue0ConsumeValueValue1.ts] ////

//// [globals.d.ts]

//// [input.ts]
export let value = 0; consume(value); value = 1;

//// [input.ts]
export let value = 0; consume(value); value = 1;
