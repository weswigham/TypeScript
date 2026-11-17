//// [tests/cases/conformance/lint/rules/require-atomic-updates/lintRequireAtomicUpdatesRolloutUsageUpstreamLetFooAsyncFunctionXFooBarAwaitFoo.ts] ////

//// [globals.d.ts]

//// [input.ts]
let foo; async function x() { foo = bar + await foo; }

//// [input.ts]
let foo; async function x() { foo = bar + await foo; }
