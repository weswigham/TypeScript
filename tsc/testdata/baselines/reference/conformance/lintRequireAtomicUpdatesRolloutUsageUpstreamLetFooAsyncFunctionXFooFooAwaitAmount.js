//// [tests/cases/conformance/lint/rules/require-atomic-updates/lintRequireAtomicUpdatesRolloutUsageUpstreamLetFooAsyncFunctionXFooFooAwaitAmount.ts] ////

//// [globals.d.ts]

//// [input.ts]
let foo; async function x() { foo = foo + await amount; }

//// [input.ts]
let foo; async function x() { foo = foo + await amount; }
