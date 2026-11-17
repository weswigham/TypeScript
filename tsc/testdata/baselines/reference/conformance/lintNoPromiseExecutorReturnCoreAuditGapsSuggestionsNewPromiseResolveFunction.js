//// [tests/cases/conformance/lint/rules/no-promise-executor-return/lintNoPromiseExecutorReturnCoreAuditGapsSuggestionsNewPromiseResolveFunction.ts] ////

//// [input.ts]
new Promise(resolve => (function() {}));

//// [input.ts]
new Promise(resolve => (function() {}));
