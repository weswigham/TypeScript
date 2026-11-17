//// [tests/cases/conformance/lint/rules/require-atomic-updates/lintRequireAtomicUpdatesRolloutUsageAtomicUpdatesLetValueAsyncFunctionRunValueCallAwaitAmountValue.ts] ////

//// [globals.d.ts]

//// [input.ts]
let value; async function run() { value = call(await amount, value); }

//// [input.ts]
let value; async function run() { value = call(await amount, value); }
