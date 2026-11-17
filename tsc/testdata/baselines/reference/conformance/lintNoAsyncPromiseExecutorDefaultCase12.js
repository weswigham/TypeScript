//// [tests/cases/conformance/lint/rules/no-async-promise-executor/lintNoAsyncPromiseExecutorDefaultCase12.ts] ////

//// [input.ts]
function f() { new Promise(async () => {}); var Promise; }

//// [input.ts]
function f() { new Promise(async () => {}); var Promise; }
