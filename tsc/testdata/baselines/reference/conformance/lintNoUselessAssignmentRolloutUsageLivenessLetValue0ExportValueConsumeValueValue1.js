//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageLivenessLetValue0ExportValueConsumeValueValue1.ts] ////

//// [globals.d.ts]

//// [input.ts]
let value = 0; export {value}; consume(value); value = 1;

//// [input.ts]
let value = 0; export {value}; consume(value); value = 1;
