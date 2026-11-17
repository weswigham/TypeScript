//// [tests/cases/conformance/lint/rules/no-unsafe-enum-assignment/lintTypescriptNoUnsafeEnumAssignmentRolloutUnsafeFlowEnumMutate.ts] ////

//// [input.ts]
enum Fruit { Apple } let fruit = Fruit.Apple; fruit++; fruit += 1;

//// [input.ts]
enum Fruit { Apple } let fruit = Fruit.Apple; fruit++; fruit += 1;
