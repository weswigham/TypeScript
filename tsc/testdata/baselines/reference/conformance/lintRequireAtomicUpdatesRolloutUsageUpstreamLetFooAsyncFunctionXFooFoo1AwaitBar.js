//// [tests/cases/conformance/lint/rules/require-atomic-updates/lintRequireAtomicUpdatesRolloutUsageUpstreamLetFooAsyncFunctionXFooFoo1AwaitBar.ts] ////

//// [globals.d.ts]

//// [input.ts]
let foo; async function x() { foo = foo + 1; await bar; }

//// [input.ts]
let foo; async function x() { foo = foo + 1; await bar; }
