//// [tests/cases/conformance/lint/rules/no-unsafe-enum-assignment/lintTypescriptNoUnsafeEnumAssignmentRolloutUnsafeFlowEnumAnyAllowed.ts] ////

//// [input.ts]
enum Fruit { Apple } declare const value: any; const fruit: Fruit = value;

//// [input.ts]
enum Fruit { Apple } declare const value: any; const fruit: Fruit = value;
