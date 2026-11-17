//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageLivenessFunctionRunLetValue0ValueValue1Value2ConsumeValue.ts] ////

//// [globals.d.ts]

//// [input.ts]
function run() { let value = 0; value = value + 1; value = 2; consume(value); }

//// [input.ts]
function run() { let value = 0; value = value + 1; value = 2; consume(value); }
