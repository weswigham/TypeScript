//// [tests/cases/conformance/lint/rules/prefer-promise-reject-errors/lintPreferPromiseRejectErrorsCoreScopeCReportsFunctionLocalPromiseUndefinedPromiseReject0PromiseRejectErrorsPro.ts] ////

//// [input.ts]
function local(Promise, undefined) { Promise.reject(0); } Promise.reject(...errors); Promise.reject(value);

//// [input.ts]
function local(Promise, undefined) { Promise.reject(0); } Promise.reject(...errors); Promise.reject(value);
