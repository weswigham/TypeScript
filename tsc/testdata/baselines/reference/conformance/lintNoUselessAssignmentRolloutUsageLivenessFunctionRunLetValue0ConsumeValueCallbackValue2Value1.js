//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageLivenessFunctionRunLetValue0ConsumeValueCallbackValue2Value1.ts] ////

//// [globals.d.ts]

//// [input.ts]
function run() { let value = 0; consume(value); callback(() => value = 2); value = 1; }

//// [input.ts]
function run() { let value = 0; consume(value); callback(() => value = 2); value = 1; }
