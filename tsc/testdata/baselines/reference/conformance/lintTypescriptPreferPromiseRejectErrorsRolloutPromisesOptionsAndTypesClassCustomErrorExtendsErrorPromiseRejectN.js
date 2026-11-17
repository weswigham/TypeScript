//// [tests/cases/conformance/lint/rules/prefer-promise-reject-errors/lintTypescriptPreferPromiseRejectErrorsRolloutPromisesOptionsAndTypesClassCustomErrorExtendsErrorPromiseRejectN.ts] ////

//// [input.ts]
class CustomError extends Error {} Promise.reject(new CustomError());
export {};

//// [input.ts]
class CustomError extends Error {} Promise.reject(new CustomError());
export {};
