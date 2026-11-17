//// [tests/cases/conformance/lint/rules/require-atomic-updates/lintRequireAtomicUpdatesRolloutUsageUpstreamLetFooAsyncFunctionXFooAwaitFooYieldBar.ts] ////

//// [globals.d.ts]

//// [input.ts]
let foo; async function* x() { foo = await foo + (yield bar); }

//// [input.ts]
let foo; async function* x() { foo = await foo + (yield bar); }
