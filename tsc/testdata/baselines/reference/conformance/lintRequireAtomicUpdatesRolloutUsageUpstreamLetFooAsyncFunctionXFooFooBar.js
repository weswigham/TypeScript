//// [tests/cases/conformance/lint/rules/require-atomic-updates/lintRequireAtomicUpdatesRolloutUsageUpstreamLetFooAsyncFunctionXFooFooBar.ts] ////

//// [globals.d.ts]

//// [input.ts]
let foo; async function x() { foo = foo + bar; }

//// [input.ts]
let foo; async function x() { foo = foo + bar; }
