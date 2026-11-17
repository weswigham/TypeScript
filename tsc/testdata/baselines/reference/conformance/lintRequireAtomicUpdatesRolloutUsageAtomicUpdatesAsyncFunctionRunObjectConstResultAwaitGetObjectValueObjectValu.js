//// [tests/cases/conformance/lint/rules/require-atomic-updates/lintRequireAtomicUpdatesRolloutUsageAtomicUpdatesAsyncFunctionRunObjectConstResultAwaitGetObjectValueObjectValu.ts] ////

//// [globals.d.ts]

//// [input.ts]
async function run(object) { const result = await get(object.value); object.value = result; }

//// [input.ts]
async function run(object) { const result = await get(object.value); object.value = result; }
