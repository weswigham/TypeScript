//// [tests/cases/conformance/lint/rules/prefer-promise-reject-errors/lintPreferPromiseRejectErrorsCoreScopeCReportsNewPromiseResolveRejectFallbackReject0NewPromiseResolveRejectReje.ts] ////

//// [input.ts]
new Promise((resolve, reject = fallback) => reject(0)); new Promise((resolve, {reject}) => reject(0));

//// [input.ts]
new Promise((resolve, reject = fallback) => reject(0)); new Promise((resolve, {reject}) => reject(0));
