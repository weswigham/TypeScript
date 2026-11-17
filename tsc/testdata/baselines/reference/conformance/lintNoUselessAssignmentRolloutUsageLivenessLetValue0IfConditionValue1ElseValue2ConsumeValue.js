//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageLivenessLetValue0IfConditionValue1ElseValue2ConsumeValue.ts] ////

//// [globals.d.ts]

//// [input.ts]
let value = 0; if (condition) value = 1; else value = 2; consume(value);

//// [input.ts]
let value = 0; if (condition) value = 1; else value = 2; consume(value);
