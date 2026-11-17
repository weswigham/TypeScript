//// [tests/cases/conformance/lint/rules/require-atomic-updates/lintRequireAtomicUpdatesRolloutUsageUpstreamLetFoo0AsyncFunctionXFooABFooAwaitBarIfBaz.ts] ////

//// [globals.d.ts]

//// [input.ts]
let foo = 0; async function x() { foo = (a ? b : foo) + await bar; if (baz); }

//// [input.ts]
let foo = 0; async function x() { foo = (a ? b : foo) + await bar; if (baz); }
