//// [tests/cases/conformance/lint/rules/require-atomic-updates/lintRequireAtomicUpdatesRolloutUsageUpstreamAsyncFunctionXFooAwaitBar.ts] ////

//// [globals.d.ts]

//// [input.ts]
async function x() { foo += await bar; }

//// [input.ts]
async function x() { foo += await bar; }
