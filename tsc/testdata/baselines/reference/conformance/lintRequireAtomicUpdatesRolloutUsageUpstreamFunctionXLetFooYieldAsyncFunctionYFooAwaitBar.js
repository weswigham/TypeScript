//// [tests/cases/conformance/lint/rules/require-atomic-updates/lintRequireAtomicUpdatesRolloutUsageUpstreamFunctionXLetFooYieldAsyncFunctionYFooAwaitBar.ts] ////

//// [globals.d.ts]

//// [input.ts]
function* x() { let foo; yield async function y() { foo += await bar; } }

//// [input.ts]
function* x() { let foo; yield async function y() { foo += await bar; } }
