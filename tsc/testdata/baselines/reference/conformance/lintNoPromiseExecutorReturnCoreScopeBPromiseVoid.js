//// [tests/cases/conformance/lint/rules/no-promise-executor-return/lintNoPromiseExecutorReturnCoreScopeBPromiseVoid.ts] ////

//// [input.ts]
new Promise(resolve => void resolve()); new Promise(resolve => { return void resolve(); }); function run(Promise) { new Promise(resolve => resolve()); }

//// [input.ts]
new Promise(resolve => void resolve()); new Promise(resolve => { return void resolve(); }); function run(Promise) { new Promise(resolve => resolve()); }
