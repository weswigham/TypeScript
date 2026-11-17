//// [tests/cases/conformance/lint/rules/require-atomic-updates/lintRequireAtomicUpdatesRolloutUsageUpstreamLetFooAsyncFunctionXFooFooBarBazAwaitAmount.ts] ////

//// [globals.d.ts]

//// [input.ts]
let foo; async function x() { foo = foo + (bar ? baz : await amount); }

//// [input.ts]
let foo; async function x() { foo = foo + (bar ? baz : await amount); }
