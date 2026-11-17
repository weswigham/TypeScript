//// [tests/cases/conformance/lint/rules/no-promise-executor-return/noPromiseExecutorReturnScopeBOptions.ts] ////

//// [input.ts]
new Promise(resolve => void resolve(1));
new Promise(resolve => { return void resolve(1); });
new Promise(resolve => resolve(1));
new Promise(resolve => { return resolve(1); });

//// [input.ts]
new Promise(resolve => void resolve(1));
new Promise(resolve => { return void resolve(1); });
new Promise(resolve => resolve(1));
new Promise(resolve => { return resolve(1); });
