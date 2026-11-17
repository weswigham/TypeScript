//// [tests/cases/conformance/lint/rules/await-thenable/lintTypescriptAwaitThenableRolloutPromisesOptionsAndTypesDeclareConstValuesNumberPromiseNumberPromiseAllValues.ts] ////

//// [input.ts]
declare const values: (number | Promise<number>)[]; Promise.all(values);
export {};

//// [input.ts]
declare const values: (number | Promise<number>)[]; Promise.all(values);
export {};
