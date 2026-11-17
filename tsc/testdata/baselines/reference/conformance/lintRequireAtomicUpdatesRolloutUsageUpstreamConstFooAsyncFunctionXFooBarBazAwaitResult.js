//// [tests/cases/conformance/lint/rules/require-atomic-updates/lintRequireAtomicUpdatesRolloutUsageUpstreamConstFooAsyncFunctionXFooBarBazAwaitResult.ts] ////

//// [globals.d.ts]

//// [input.ts]
const foo = []; async function x() { foo[bar].baz += await result;  }

//// [input.ts]
const foo = []; async function x() { foo[bar].baz += await result;  }
