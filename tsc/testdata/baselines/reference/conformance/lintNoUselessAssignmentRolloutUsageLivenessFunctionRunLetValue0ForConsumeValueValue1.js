//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageLivenessFunctionRunLetValue0ForConsumeValueValue1.ts] ////

//// [globals.d.ts]

//// [input.ts]
function run() { let value = 0; for (;;) { consume(value); value = 1; } }

//// [input.ts]
function run() { let value = 0; for (;;) { consume(value); value = 1; } }
