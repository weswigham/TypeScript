//// [tests/cases/conformance/lint/rules/require-atomic-updates/lintRequireAtomicUpdatesRolloutUsageAtomicUpdatesLetValueAsyncFunctionRunValueValueAwaitAmount.ts] ////

//// [globals.d.ts]

//// [input.ts]
let value; async function run() { value = value + await amount; }

//// [input.ts]
let value; async function run() { value = value + await amount; }
