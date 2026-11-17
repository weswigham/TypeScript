//// [tests/cases/conformance/lint/rules/require-atomic-updates/lintRequireAtomicUpdatesRolloutUsageUpstreamLetFooAsyncFunctionXFooAwaitResultFoo.ts] ////

//// [globals.d.ts]

//// [input.ts]
let foo; async function x() { foo = (await result)(foo); }

//// [input.ts]
let foo; async function x() { foo = (await result)(foo); }
