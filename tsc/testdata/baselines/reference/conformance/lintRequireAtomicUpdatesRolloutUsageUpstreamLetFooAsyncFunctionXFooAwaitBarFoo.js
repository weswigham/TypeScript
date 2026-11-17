//// [tests/cases/conformance/lint/rules/require-atomic-updates/lintRequireAtomicUpdatesRolloutUsageUpstreamLetFooAsyncFunctionXFooAwaitBarFoo.ts] ////

//// [globals.d.ts]

//// [input.ts]
let foo; async function x() { foo = await bar + foo; }

//// [input.ts]
let foo; async function x() { foo = await bar + foo; }
