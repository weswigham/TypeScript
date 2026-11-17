//// [tests/cases/conformance/lint/rules/require-atomic-updates/lintRequireAtomicUpdatesRolloutUsageUpstreamAsyncFunctionXLetFooBarLetFooBlahFooFooAwaitResult.ts] ////

//// [globals.d.ts]

//// [input.ts]
async function x() { let foo; bar(() => { let foo; blah(foo); }); foo += await result; }

//// [input.ts]
async function x() { let foo; bar(() => { let foo; blah(foo); }); foo += await result; }
