//// [tests/cases/conformance/lint/rules/no-async-promise-executor/lintNoAsyncPromiseExecutorDefaultCase11.ts] ////

//// [input.ts]
function f(Promise) { new Promise(async () => {}); }

//// [input.ts]
function f(Promise) { new Promise(async () => {}); }
