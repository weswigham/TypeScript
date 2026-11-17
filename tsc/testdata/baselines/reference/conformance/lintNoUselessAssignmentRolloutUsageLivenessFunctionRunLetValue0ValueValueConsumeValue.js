//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageLivenessFunctionRunLetValue0ValueValueConsumeValue.ts] ////

//// [globals.d.ts]

//// [input.ts]
function run() { let value = 0; value = value++; consume(value); }

//// [input.ts]
function run() { let value = 0; value = value++; consume(value); }
