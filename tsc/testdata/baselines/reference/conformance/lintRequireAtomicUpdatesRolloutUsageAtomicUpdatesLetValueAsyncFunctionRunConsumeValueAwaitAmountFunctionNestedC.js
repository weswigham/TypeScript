//// [tests/cases/conformance/lint/rules/require-atomic-updates/lintRequireAtomicUpdatesRolloutUsageAtomicUpdatesLetValueAsyncFunctionRunConsumeValueAwaitAmountFunctionNestedC.ts] ////

//// [globals.d.ts]

//// [input.ts]
let value; async function run() { consume(value); await amount; function nested() { consume(value); } value = 1; }

//// [input.ts]
let value; async function run() { consume(value); await amount; function nested() { consume(value); } value = 1; }
