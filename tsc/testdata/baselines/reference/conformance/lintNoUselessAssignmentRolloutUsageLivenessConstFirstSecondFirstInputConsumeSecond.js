//// [tests/cases/conformance/lint/rules/no-useless-assignment/lintNoUselessAssignmentRolloutUsageLivenessConstFirstSecondFirstInputConsumeSecond.ts] ////

//// [globals.d.ts]

//// [input.ts]
const {first, second = first} = input; consume(second);

//// [input.ts]
const {first, second = first} = input; consume(second);
