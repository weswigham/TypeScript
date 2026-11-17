//// [tests/cases/conformance/lint/rules/no-unsafe-argument/lintTypescriptNoUnsafeArgumentRolloutUnsafeFlowNestedGeneric.ts] ////

//// [input.ts]
declare function take(x: Set<Set<string>>): void; take(new Set<Set<any>>());

//// [input.ts]
declare function take(x: Set<Set<string>>): void; take(new Set<Set<any>>());
