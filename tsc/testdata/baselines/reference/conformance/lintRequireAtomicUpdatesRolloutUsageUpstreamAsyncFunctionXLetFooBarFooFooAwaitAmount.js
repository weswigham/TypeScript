//// [tests/cases/conformance/lint/rules/require-atomic-updates/lintRequireAtomicUpdatesRolloutUsageUpstreamAsyncFunctionXLetFooBarFooFooAwaitAmount.ts] ////

//// [globals.d.ts]

//// [input.ts]
async function x() { let foo; bar(() => foo); foo += await amount; }

//// [input.ts]
async function x() { let foo; bar(() => foo); foo += await amount; }
