//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageLivenessFunctionRunLetValue0IfConditionValue1ReturnConsumeValue.ts] ////

//// [globals.d.ts]

//// [input.ts]
function run() { let value = 0; if (condition) { value = 1; return; } consume(value); }

//// [input.ts]
function run() { let value = 0; if (condition) { value = 1; return; } consume(value); }
