//// [tests/cases/conformance/lint/rules/no-async-promise-executor/lintNoAsyncPromiseExecutorDefaultCase10.ts] ////

//// [input.ts]
const executor = async () => {}; new Promise(executor)

//// [input.ts]
const executor = async () => {}; new Promise(executor)
