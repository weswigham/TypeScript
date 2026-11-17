//// [tests/cases/conformance/lint/rules/require-atomic-updates/lintRequireAtomicUpdatesRolloutUsageUpstreamAsyncFunctionXLetFooBarBaz1FooAwaitAmount.ts] ////

//// [globals.d.ts]

//// [input.ts]
async function x() { let foo; bar(() => baz += 1); foo += await amount; }

//// [input.ts]
async function x() { let foo; bar(() => baz += 1); foo += await amount; }
