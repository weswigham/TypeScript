//// [tests/cases/conformance/lint/rules/require-atomic-updates/lintRequireAtomicUpdatesRolloutUsageAtomicUpdatesLetValueAsyncFunctionRunValueAwaitAmountValue.ts] ////

//// [globals.d.ts]

//// [input.ts]
let value; async function run() { value = await amount + value; }

//// [input.ts]
let value; async function run() { value = await amount + value; }
