//// [tests/cases/conformance/lint/rules/no-unsafe-argument/lintTypescriptNoUnsafeArgumentRolloutUnsafeFlowGenericRest.ts] ////

//// [input.ts]
declare function take<T extends any[]>(...x: T): void; take(1 as any);

//// [input.ts]
declare function take<T extends any[]>(...x: T): void; take(1 as any);
