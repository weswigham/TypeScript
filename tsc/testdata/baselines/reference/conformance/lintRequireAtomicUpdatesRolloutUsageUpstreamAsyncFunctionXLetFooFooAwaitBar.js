//// [tests/cases/conformance/lint/rules/require-atomic-updates/lintRequireAtomicUpdatesRolloutUsageUpstreamAsyncFunctionXLetFooFooAwaitBar.ts] ////

//// [globals.d.ts]

//// [input.ts]
async function x() { let foo; foo += await bar; }

//// [input.ts]
async function x() { let foo; foo += await bar; }
