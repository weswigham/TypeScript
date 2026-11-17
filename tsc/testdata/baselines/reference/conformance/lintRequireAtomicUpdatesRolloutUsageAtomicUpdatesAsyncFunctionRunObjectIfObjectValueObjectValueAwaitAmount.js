//// [tests/cases/conformance/lint/rules/require-atomic-updates/lintRequireAtomicUpdatesRolloutUsageAtomicUpdatesAsyncFunctionRunObjectIfObjectValueObjectValueAwaitAmount.ts] ////

//// [globals.d.ts]

//// [input.ts]
async function run(object) { if (object.value) object.value = await amount; }

//// [input.ts]
async function run(object) { if (object.value) object.value = await amount; }
