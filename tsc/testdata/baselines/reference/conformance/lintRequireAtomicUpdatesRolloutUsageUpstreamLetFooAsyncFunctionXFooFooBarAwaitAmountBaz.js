//// [tests/cases/conformance/lint/rules/require-atomic-updates/lintRequireAtomicUpdatesRolloutUsageUpstreamLetFooAsyncFunctionXFooFooBarAwaitAmountBaz.ts] ////

//// [globals.d.ts]

//// [input.ts]
let foo; async function x() { foo = foo + (bar ? await amount : baz); }

//// [input.ts]
let foo; async function x() { foo = foo + (bar ? await amount : baz); }
