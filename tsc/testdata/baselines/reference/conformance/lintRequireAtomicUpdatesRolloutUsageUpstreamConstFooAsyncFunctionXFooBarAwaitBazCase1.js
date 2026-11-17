//// [tests/cases/conformance/lint/rules/require-atomic-updates/lintRequireAtomicUpdatesRolloutUsageUpstreamConstFooAsyncFunctionXFooBarAwaitBazCase1.ts] ////

//// [globals.d.ts]

//// [input.ts]
const foo = {}; async function x() { foo.bar += await baz }

//// [input.ts]
const foo = {}; async function x() { foo.bar += await baz }
