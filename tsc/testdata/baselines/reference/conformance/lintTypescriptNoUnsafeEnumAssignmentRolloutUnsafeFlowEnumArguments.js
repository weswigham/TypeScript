//// [tests/cases/conformance/lint/rules/no-unsafe-enum-assignment/lintTypescriptNoUnsafeEnumAssignmentRolloutUnsafeFlowEnumArguments.ts] ////

//// [input.ts]
enum Fruit { Apple } declare function take(x: Fruit): void; take(0);

//// [input.ts]
enum Fruit { Apple } declare function take(x: Fruit): void; take(0);
