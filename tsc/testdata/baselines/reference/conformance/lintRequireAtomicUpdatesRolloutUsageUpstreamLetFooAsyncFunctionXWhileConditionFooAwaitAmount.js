//// [tests/cases/conformance/lint/rules/require-atomic-updates/lintRequireAtomicUpdatesRolloutUsageUpstreamLetFooAsyncFunctionXWhileConditionFooAwaitAmount.ts] ////

//// [globals.d.ts]

//// [input.ts]
let foo; async function x() { while (condition) { foo += await amount; } }

//// [input.ts]
let foo; async function x() { while (condition) { foo += await amount; } }
