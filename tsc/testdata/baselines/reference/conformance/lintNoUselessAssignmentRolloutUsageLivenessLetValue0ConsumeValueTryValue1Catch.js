//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageLivenessLetValue0ConsumeValueTryValue1Catch.ts] ////

//// [globals.d.ts]

//// [input.ts]
let value = 0; consume(value); try { value = 1; } catch {}

//// [input.ts]
let value = 0; consume(value); try { value = 1; } catch {}
