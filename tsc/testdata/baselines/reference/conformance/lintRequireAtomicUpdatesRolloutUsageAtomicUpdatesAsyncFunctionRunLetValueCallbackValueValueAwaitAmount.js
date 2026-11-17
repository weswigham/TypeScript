//// [tests/cases/conformance/lint/rules/require-atomic-updates/lintRequireAtomicUpdatesRolloutUsageAtomicUpdatesAsyncFunctionRunLetValueCallbackValueValueAwaitAmount.ts] ////

//// [globals.d.ts]

//// [input.ts]
async function run() { let value; callback(() => value); value += await amount; }

//// [input.ts]
async function run() { let value; callback(() => value); value += await amount; }
