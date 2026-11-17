//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageLivenessLetFirstSecondFirst1InputFirst2ConsumeFirstSecond.ts] ////

//// [globals.d.ts]

//// [input.ts]
let {first, second = (first = 1)} = input; first = 2; consume(first, second);

//// [input.ts]
let {first, second = (first = 1)} = input; first = 2; consume(first, second);
