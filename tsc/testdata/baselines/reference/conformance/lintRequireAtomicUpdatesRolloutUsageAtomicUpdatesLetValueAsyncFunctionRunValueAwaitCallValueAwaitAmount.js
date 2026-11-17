//// [tests/cases/conformance/lint/rules/require-atomic-updates/lintRequireAtomicUpdatesRolloutUsageAtomicUpdatesLetValueAsyncFunctionRunValueAwaitCallValueAwaitAmount.ts] ////

//// [globals.d.ts]

//// [input.ts]
let value; async function run() { value = await call(value, await amount); }

//// [input.ts]
let value; async function run() { value = await call(value, await amount); }
