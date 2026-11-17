//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageLivenessClassBoxStaticLetValue0ConsumeValueValue1.ts] ////

//// [globals.d.ts]

//// [input.ts]
class Box { static { let value = 0; consume(value); value = 1; } }

//// [input.ts]
class Box { static { let value = 0; consume(value); value = 1; } }
