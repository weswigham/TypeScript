//// [tests/cases/conformance/lint/rules/require-atomic-updates/lintRequireAtomicUpdatesRolloutUsageAtomicUpdatesLetValueAsyncFunctionRunConsumeValueAwaitAmountConsumeValueVal.ts] ////

//// [globals.d.ts]

//// [input.ts]
let value; async function run() { consume(value); await amount; consume(value); value = 1; }

//// [input.ts]
let value; async function run() { consume(value); await amount; consume(value); value = 1; }
