//// [tests/cases/conformance/lint/rules/require-atomic-updates/lintRequireAtomicUpdatesUsageCatchRefreshesAtomicRead.ts] ////

//// [globals.d.ts]

//// [input.ts]
async function f(shared) { consume(shared.value); try { const result = await task(); shared.value = result; } catch { consume(shared); shared.value = 1; } }

//// [input.ts]
async function f(shared) { consume(shared.value); try { const result = await task(); shared.value = result; } catch { consume(shared); shared.value = 1; } }
