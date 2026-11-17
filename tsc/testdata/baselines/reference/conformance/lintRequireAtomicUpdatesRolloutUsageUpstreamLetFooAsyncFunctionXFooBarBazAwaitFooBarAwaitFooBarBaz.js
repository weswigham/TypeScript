//// [tests/cases/conformance/lint/rules/require-atomic-updates/lintRequireAtomicUpdatesRolloutUsageUpstreamLetFooAsyncFunctionXFooBarBazAwaitFooBarAwaitFooBarBaz.ts] ////

//// [globals.d.ts]

//// [input.ts]
let foo = {}; async function x() { foo[bar].baz = await (foo.bar += await foo[bar].baz) }

//// [input.ts]
let foo = {}; async function x() { foo[bar].baz = await (foo.bar += await foo[bar].baz) }
