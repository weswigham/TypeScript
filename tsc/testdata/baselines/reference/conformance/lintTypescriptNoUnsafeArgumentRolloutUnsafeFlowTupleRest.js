//// [tests/cases/conformance/lint/rules/no-unsafe-argument/lintTypescriptNoUnsafeArgumentRolloutUnsafeFlowTupleRest.ts] ////

//// [input.ts]
declare const value: any; declare function take(...x: [string, number]): void; take('a', value);

//// [input.ts]
declare const value: any; declare function take(...x: [string, number]): void; take('a', value);
