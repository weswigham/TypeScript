//// [tests/cases/conformance/lint/rules/require-atomic-updates/lintRequireAtomicUpdatesRolloutUsageAtomicUpdatesLetValueAsyncFunctionRunValueAwaitAmount.ts] ////

//// [globals.d.ts]

//// [input.ts]
let value; async function run() { value += await amount; }

//// [input.ts]
let value; async function run() { value += await amount; }
