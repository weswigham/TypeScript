//// [tests/cases/conformance/lint/rules/require-atomic-updates/lintRequireAtomicUpdatesRolloutUsageAtomicUpdatesAsyncFunctionRunConstObjectIfObjectValueObjectValueAwaitAmount.ts] ////

//// [globals.d.ts]

//// [input.ts]
async function run() { const object = {}; if (object.value) object.value = await amount; }

//// [input.ts]
async function run() { const object = {}; if (object.value) object.value = await amount; }
