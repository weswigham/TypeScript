//// [tests/cases/conformance/lint/rules/prefer-promise-reject-errors/lintPreferPromiseRejectErrorsCoreScopeCReportsNewPromiseResolveRejectRejectBadReject0FunctionFRejectRejectOk.ts] ////

//// [input.ts]
new Promise((resolve, reject) => { reject('bad'); (() => reject(0))(); function f(reject) { reject('ok'); } });

//// [input.ts]
new Promise((resolve, reject) => { reject('bad'); (() => reject(0))(); function f(reject) { reject('ok'); } });
