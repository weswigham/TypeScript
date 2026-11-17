//// [tests/cases/conformance/lint/rules/no-async-promise-executor/lintNoAsyncPromiseExecutorDefaultCase7.ts] ////

//// [input.ts]
new Promise(() => {}, async function unrelated() {})

//// [input.ts]
new Promise(() => {}, async function unrelated() {})
