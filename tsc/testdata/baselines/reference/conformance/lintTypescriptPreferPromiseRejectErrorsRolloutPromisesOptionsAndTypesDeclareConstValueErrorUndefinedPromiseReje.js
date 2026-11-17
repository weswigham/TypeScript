//// [tests/cases/conformance/lint/rules/prefer-promise-reject-errors/lintTypescriptPreferPromiseRejectErrorsRolloutPromisesOptionsAndTypesDeclareConstValueErrorUndefinedPromiseReje.ts] ////

//// [input.ts]
declare const value: Error | undefined; Promise.reject(value);
export {};

//// [input.ts]
declare const value: Error | undefined; Promise.reject(value);
export {};
