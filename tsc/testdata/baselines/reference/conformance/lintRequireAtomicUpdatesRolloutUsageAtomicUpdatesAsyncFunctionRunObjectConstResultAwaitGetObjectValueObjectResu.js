//// [tests/cases/conformance/lint/rules/require-atomic-updates/lintRequireAtomicUpdatesRolloutUsageAtomicUpdatesAsyncFunctionRunObjectConstResultAwaitGetObjectValueObjectResu.ts] ////

//// [globals.d.ts]

//// [input.ts]
async function run(object) { const result = await get(object.value); object = result; }

//// [input.ts]
async function run(object) { const result = await get(object.value); object = result; }
