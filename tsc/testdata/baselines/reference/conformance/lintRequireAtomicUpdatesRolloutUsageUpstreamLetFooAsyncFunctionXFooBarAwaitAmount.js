//// [tests/cases/conformance/lint/rules/require-atomic-updates/lintRequireAtomicUpdatesRolloutUsageUpstreamLetFooAsyncFunctionXFooBarAwaitAmount.ts] ////

//// [globals.d.ts]

//// [input.ts]
let foo; async function x() { foo += bar + await amount; }

//// [input.ts]
let foo; async function x() { foo += bar + await amount; }
