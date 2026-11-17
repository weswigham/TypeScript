//// [tests/cases/conformance/lint/rules/require-atomic-updates/lintRequireAtomicUpdatesRolloutUsageUpstreamLetFooAsyncFunctionXFooAwaitResultFooAwaitSomethingElse.ts] ////

//// [globals.d.ts]

//// [input.ts]
let foo; async function x() { foo = await result(foo, await somethingElse); }

//// [input.ts]
let foo; async function x() { foo = await result(foo, await somethingElse); }
