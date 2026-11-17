//// [tests/cases/conformance/lint/rules/require-atomic-updates/lintRequireAtomicUpdatesRolloutUsageUpstreamLetFoo0AsyncFunctionXFooABCDFooEFGHAwaitBarIfBaz.ts] ////

//// [globals.d.ts]

//// [input.ts]
let foo = 0; async function x() { foo = (a ? b ? c ? d ? foo : e : f : g : h) + await bar; if (baz); }

//// [input.ts]
let foo = 0; async function x() { foo = (a ? b ? c ? d ? foo : e : f : g : h) + await bar; if (baz); }
