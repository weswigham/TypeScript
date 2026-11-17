//// [tests/cases/conformance/lint/rules/no-promise-executor-return/lintNoPromiseExecutorReturnCoreAuditGapsSuggestionsNewPromiseResolveKeepWork.ts] ////

//// [input.ts]
new Promise(resolve => /* keep */ work());

//// [input.ts]
new Promise(resolve => /* keep */ work());
