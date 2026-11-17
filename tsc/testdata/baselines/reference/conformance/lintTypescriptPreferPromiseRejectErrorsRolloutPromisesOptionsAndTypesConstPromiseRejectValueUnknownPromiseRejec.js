//// [tests/cases/conformance/lint/rules/prefer-promise-reject-errors/lintTypescriptPreferPromiseRejectErrorsRolloutPromisesOptionsAndTypesConstPromiseRejectValueUnknownPromiseRejec.ts] ////

//// [input.ts]
const Promise = { reject(value: unknown) {} }; Promise.reject(1); export {};
export {};

//// [input.ts]
const Promise = { reject(value: unknown) {} }; Promise.reject(1); export {};
export {};
