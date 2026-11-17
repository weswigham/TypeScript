//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageLivenessFunctionRunLetValue0ConsumeValueReturnValue1.ts] ////

//// [globals.d.ts]

//// [input.ts]
function run() { let value = 0; consume(value); return; value = 1; }

//// [input.ts]
function run() { let value = 0; consume(value); return; value = 1; }
