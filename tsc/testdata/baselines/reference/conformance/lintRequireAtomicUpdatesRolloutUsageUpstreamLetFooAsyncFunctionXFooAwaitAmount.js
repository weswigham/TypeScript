//// [tests/cases/conformance/lint/rules/require-atomic-updates/lintRequireAtomicUpdatesRolloutUsageUpstreamLetFooAsyncFunctionXFooAwaitAmount.ts] ////

//// [globals.d.ts]

//// [input.ts]
let foo; async function x() { foo += await amount; }

//// [input.ts]
let foo; async function x() { foo += await amount; }
