//// [tests/cases/conformance/lint/rules/prefer-promise-reject-errors/lintTypescriptPreferPromiseRejectErrorsRolloutPromisesDefaults.ts] ////

//// [input.ts]
Promise.reject('bad'); Promise.reject(new Error('bad'));
export {};

//// [input.ts]
Promise.reject('bad'); Promise.reject(new Error('bad'));
export {};
