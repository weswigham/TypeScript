//// [tests/cases/conformance/lint/rules/require-atomic-updates/lintRequireAtomicUpdatesRolloutUsageUpstreamLetFooAsyncFunctionXFooConditionFooAwaitBarAwaitBar.ts] ////

//// [globals.d.ts]

//// [input.ts]
let foo; async function x() { foo = (condition ? foo : await bar) + await bar; }

//// [input.ts]
let foo; async function x() { foo = (condition ? foo : await bar) + await bar; }
