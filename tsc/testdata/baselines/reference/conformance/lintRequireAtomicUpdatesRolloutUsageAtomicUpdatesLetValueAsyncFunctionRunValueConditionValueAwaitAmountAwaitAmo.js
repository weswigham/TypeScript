//// [tests/cases/conformance/lint/rules/require-atomic-updates/lintRequireAtomicUpdatesRolloutUsageAtomicUpdatesLetValueAsyncFunctionRunValueConditionValueAwaitAmountAwaitAmo.ts] ////

//// [globals.d.ts]

//// [input.ts]
let value; async function run() { value = (condition ? value : await amount) + await amount; }

//// [input.ts]
let value; async function run() { value = (condition ? value : await amount) + await amount; }
