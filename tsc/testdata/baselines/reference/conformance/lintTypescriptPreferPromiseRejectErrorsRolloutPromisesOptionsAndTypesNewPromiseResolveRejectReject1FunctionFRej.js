//// [tests/cases/conformance/lint/rules/prefer-promise-reject-errors/lintTypescriptPreferPromiseRejectErrorsRolloutPromisesOptionsAndTypesNewPromiseResolveRejectReject1FunctionFRej.ts] ////

//// [input.ts]
new Promise((resolve, reject) => { reject(1); function f(reject: (value: number) => void) { reject(2); } });
export {};

//// [input.ts]
new Promise((resolve, reject) => { reject(1); function f(reject: (value: number) => void) { reject(2); } });
export {};
