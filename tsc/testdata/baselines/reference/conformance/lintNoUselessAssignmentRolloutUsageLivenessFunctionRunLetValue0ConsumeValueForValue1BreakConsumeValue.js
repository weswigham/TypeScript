//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageLivenessFunctionRunLetValue0ConsumeValueForValue1BreakConsumeValue.ts] ////

//// [globals.d.ts]

//// [input.ts]
function run() { let value = 0; consume(value); for (;;) { value = 1; break; consume(value); } }

//// [input.ts]
function run() { let value = 0; consume(value); for (;;) { value = 1; break; consume(value); } }
