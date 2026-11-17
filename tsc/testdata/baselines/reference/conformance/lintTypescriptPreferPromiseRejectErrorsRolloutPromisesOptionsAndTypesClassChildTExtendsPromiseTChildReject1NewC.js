//// [tests/cases/conformance/lint/rules/prefer-promise-reject-errors/lintTypescriptPreferPromiseRejectErrorsRolloutPromisesOptionsAndTypesClassChildTExtendsPromiseTChildReject1NewC.ts] ////

//// [input.ts]
class Child<T> extends Promise<T> {} Child.reject(1); new Child((resolve, reject) => reject(1));
export {};

//// [input.ts]
class Child<T> extends Promise<T> {} Child.reject(1); new Child((resolve, reject) => reject(1));
export {};
