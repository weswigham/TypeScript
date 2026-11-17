//// [tests/cases/conformance/lint/rules/no-promise-executor-return/lintNoPromiseExecutorReturnCoreScopeBPromiseReturns.ts] ////

//// [input.ts]
new Promise(resolve => resolve()); new Promise(function(resolve) { if (ready) return 1; function nested() { return 2; } return; });

//// [input.ts]
new Promise(resolve => resolve()); new Promise(function(resolve) { if (ready) return 1; function nested() { return 2; } return; });
