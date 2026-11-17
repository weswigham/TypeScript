//// [tests/cases/conformance/lint/rules/require-atomic-updates/lintRequireAtomicUpdatesRolloutUsageUpstreamIf1LetFooAsyncFunctionXFooAwaitAmount.ts] ////

//// [globals.d.ts]

//// [input.ts]
if (1); let foo; async function x() { foo += await amount; }

//// [input.ts]
if (1); let foo; async function x() { foo += await amount; }
