//// [tests/cases/conformance/lint/rules/prefer-promise-reject-errors/lintTypescriptPreferPromiseRejectErrorsRolloutPromisesOptionsAndTypesClassCustomRejectionPromiseRejectNewCustom.ts] ////

//// [input.ts]
class CustomRejection {} Promise.reject(new CustomRejection());
export {};

//// [input.ts]
class CustomRejection {} Promise.reject(new CustomRejection());
export {};
