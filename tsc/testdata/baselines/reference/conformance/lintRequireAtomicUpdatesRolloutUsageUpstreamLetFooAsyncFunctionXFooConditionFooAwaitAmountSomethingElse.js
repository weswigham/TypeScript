//// [tests/cases/conformance/lint/rules/require-atomic-updates/lintRequireAtomicUpdatesRolloutUsageUpstreamLetFooAsyncFunctionXFooConditionFooAwaitAmountSomethingElse.ts] ////

//// [globals.d.ts]

//// [input.ts]
let foo; async function x() { foo = condition ? foo + await amount : somethingElse; }

//// [input.ts]
let foo; async function x() { foo = condition ? foo + await amount : somethingElse; }
