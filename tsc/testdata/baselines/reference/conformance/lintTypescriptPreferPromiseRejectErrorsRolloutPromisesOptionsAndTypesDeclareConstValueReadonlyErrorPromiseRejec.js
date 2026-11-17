//// [tests/cases/conformance/lint/rules/prefer-promise-reject-errors/lintTypescriptPreferPromiseRejectErrorsRolloutPromisesOptionsAndTypesDeclareConstValueReadonlyErrorPromiseRejec.ts] ////

//// [input.ts]
declare const value: Readonly<Error>; Promise.reject(value);
export {};

//// [input.ts]
declare const value: Readonly<Error>; Promise.reject(value);
export {};
