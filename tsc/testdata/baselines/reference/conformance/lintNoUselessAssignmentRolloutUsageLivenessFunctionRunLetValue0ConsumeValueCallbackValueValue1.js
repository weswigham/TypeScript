//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageLivenessFunctionRunLetValue0ConsumeValueCallbackValueValue1.ts] ////

//// [globals.d.ts]

//// [input.ts]
function run() { let value = 0; consume(value); callback(() => value); value = 1; }

//// [input.ts]
function run() { let value = 0; consume(value); callback(() => value); value = 1; }
