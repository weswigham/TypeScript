//// [tests/cases/conformance/lint/rules/require-atomic-updates/lintRequireAtomicUpdatesRolloutUsageUpstreamLetFooAsyncFunctionXFooBarAwaitSomethingFoo.ts] ////

//// [globals.d.ts]

//// [input.ts]
let foo; async function x() { foo = bar(await something, foo) }

//// [input.ts]
let foo; async function x() { foo = bar(await something, foo) }
