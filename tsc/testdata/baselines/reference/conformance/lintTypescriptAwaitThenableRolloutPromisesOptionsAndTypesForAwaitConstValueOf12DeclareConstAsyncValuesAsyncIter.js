//// [tests/cases/conformance/lint/rules/await-thenable/lintTypescriptAwaitThenableRolloutPromisesOptionsAndTypesForAwaitConstValueOf12DeclareConstAsyncValuesAsyncIter.ts] ////

//// [input.ts]
for await (const value of [1, 2]) {} declare const asyncValues: AsyncIterable<number>; for await (const value of asyncValues) {}
export {};

//// [input.ts]
for await (const value of [1, 2]) {} declare const asyncValues: AsyncIterable<number>; for await (const value of asyncValues) {}
export {};
