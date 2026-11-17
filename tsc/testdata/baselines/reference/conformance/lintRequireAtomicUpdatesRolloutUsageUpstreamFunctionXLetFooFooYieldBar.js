//// [tests/cases/conformance/lint/rules/require-atomic-updates/lintRequireAtomicUpdatesRolloutUsageUpstreamFunctionXLetFooFooYieldBar.ts] ////

//// [globals.d.ts]

//// [input.ts]
function* x() { let foo; foo += yield bar; }

//// [input.ts]
function* x() { let foo; foo += yield bar; }
