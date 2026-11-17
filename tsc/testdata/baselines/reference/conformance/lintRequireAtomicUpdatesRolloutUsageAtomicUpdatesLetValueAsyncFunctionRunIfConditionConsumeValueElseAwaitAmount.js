//// [tests/cases/conformance/lint/rules/require-atomic-updates/lintRequireAtomicUpdatesRolloutUsageAtomicUpdatesLetValueAsyncFunctionRunIfConditionConsumeValueElseAwaitAmount.ts] ////

//// [globals.d.ts]

//// [input.ts]
let value; async function run() { if (condition) consume(value); else await amount; value = 1; }

//// [input.ts]
let value; async function run() { if (condition) consume(value); else await amount; value = 1; }
