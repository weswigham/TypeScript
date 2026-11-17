//// [tests/cases/conformance/lint/rules/require-atomic-updates/lintRequireAtomicUpdatesRolloutUsageUpstreamLetFooAsyncFunctionXFooYieldFooAwaitBar.ts] ////

//// [globals.d.ts]

//// [input.ts]
let foo; async function* x() { foo = (yield foo) + await bar; }

//// [input.ts]
let foo; async function* x() { foo = (yield foo) + await bar; }
