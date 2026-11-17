//// [tests/cases/conformance/lint/rules/prefer-promise-reject-errors/lintPreferPromiseRejectErrorsCoreScopeCReportsPromiseRejectPromiseReject0PromiseRejectUndefinedPromiseRejectNew.ts] ////

//// [input.ts]
Promise.reject(); Promise.reject(0); Promise['reject'](undefined); Promise.reject(new Error());

//// [input.ts]
Promise.reject(); Promise.reject(0); Promise['reject'](undefined); Promise.reject(new Error());
