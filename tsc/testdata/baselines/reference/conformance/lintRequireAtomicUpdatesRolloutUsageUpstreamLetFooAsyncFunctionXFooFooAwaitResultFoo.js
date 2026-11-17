//// [tests/cases/conformance/lint/rules/require-atomic-updates/lintRequireAtomicUpdatesRolloutUsageUpstreamLetFooAsyncFunctionXFooFooAwaitResultFoo.ts] ////

//// [globals.d.ts]

//// [input.ts]
let foo; async function x() { foo = foo + await result(foo); }

//// [input.ts]
let foo; async function x() { foo = foo + await result(foo); }
