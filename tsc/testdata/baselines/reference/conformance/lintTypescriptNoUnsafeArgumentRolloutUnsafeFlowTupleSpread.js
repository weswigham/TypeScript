//// [tests/cases/conformance/lint/rules/no-unsafe-argument/lintTypescriptNoUnsafeArgumentRolloutUnsafeFlowTupleSpread.ts] ////

//// [input.ts]
declare function take(x: string): void; take(...([1 as any] as const));

//// [input.ts]
declare function take(x: string): void; take(...([1 as any] as const));
