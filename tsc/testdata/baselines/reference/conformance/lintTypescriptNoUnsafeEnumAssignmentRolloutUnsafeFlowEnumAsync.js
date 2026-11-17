//// [tests/cases/conformance/lint/rules/no-unsafe-enum-assignment/lintTypescriptNoUnsafeEnumAssignmentRolloutUnsafeFlowEnumAsync.ts] ////

//// [input.ts]
enum Fruit { Apple } async function get(): Promise<Fruit> { return Promise.resolve(0); }

//// [input.ts]
enum Fruit { Apple } async function get(): Promise<Fruit> { return Promise.resolve(0); }
