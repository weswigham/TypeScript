//// [tests/cases/conformance/lint/rules/require-atomic-updates/lintRequireAtomicUpdatesRolloutUsageUpstreamLetFooAsyncFunctionXFooAwaitBar.ts] ////

//// [globals.d.ts]

//// [input.ts]
let foo = ''; async function x() { foo += await bar; }

//// [input.ts]
let foo = ''; async function x() { foo += await bar; }
