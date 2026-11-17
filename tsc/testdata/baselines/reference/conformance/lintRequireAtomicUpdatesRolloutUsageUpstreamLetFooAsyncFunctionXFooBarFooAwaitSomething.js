//// [tests/cases/conformance/lint/rules/require-atomic-updates/lintRequireAtomicUpdatesRolloutUsageUpstreamLetFooAsyncFunctionXFooBarFooAwaitSomething.ts] ////

//// [globals.d.ts]

//// [input.ts]
let foo; async function x() { foo = bar(foo, await something) }

//// [input.ts]
let foo; async function x() { foo = bar(foo, await something) }
