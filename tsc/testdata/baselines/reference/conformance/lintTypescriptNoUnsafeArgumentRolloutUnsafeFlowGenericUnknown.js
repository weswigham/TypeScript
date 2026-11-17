//// [tests/cases/conformance/lint/rules/no-unsafe-argument/lintTypescriptNoUnsafeArgumentRolloutUnsafeFlowGenericUnknown.ts] ////

//// [input.ts]
declare function take(x: Set<unknown>): void; take(new Set<any>());

//// [input.ts]
declare function take(x: Set<unknown>): void; take(new Set<any>());
