//// [tests/cases/conformance/lint/rules/no-promise-executor-return/lintNoPromiseExecutorReturnCoreAuditGapsSuggestionsNewPromiseResolveClass.ts] ////

//// [input.ts]
new Promise(resolve => (class {}));

//// [input.ts]
new Promise(resolve => (class {}));
