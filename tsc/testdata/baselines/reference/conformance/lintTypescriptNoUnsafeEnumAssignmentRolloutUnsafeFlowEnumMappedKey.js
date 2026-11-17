//// [tests/cases/conformance/lint/rules/no-unsafe-enum-assignment/lintTypescriptNoUnsafeEnumAssignmentRolloutUnsafeFlowEnumMappedKey.ts] ////

//// [input.ts]
enum Fruit { Apple } declare const value: {[key in Fruit]: string}; value[0];

//// [input.ts]
enum Fruit { Apple } declare const value: {[key in Fruit]: string}; value[0];
