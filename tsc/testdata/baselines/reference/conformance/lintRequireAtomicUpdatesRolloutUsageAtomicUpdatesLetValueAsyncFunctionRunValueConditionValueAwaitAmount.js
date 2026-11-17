//// [tests/cases/conformance/lint/rules/require-atomic-updates/lintRequireAtomicUpdatesRolloutUsageAtomicUpdatesLetValueAsyncFunctionRunValueConditionValueAwaitAmount.ts] ////

//// [globals.d.ts]

//// [input.ts]
let value; async function run() { value = condition ? value : await amount; }

//// [input.ts]
let value; async function run() { value = condition ? value : await amount; }
