//// [tests/cases/conformance/lint/rules/require-atomic-updates/lintRequireAtomicUpdatesRolloutUsageUpstreamLetFooFunctionXFooBarFoo.ts] ////

//// [globals.d.ts]

//// [input.ts]
let foo; function* x() { foo = bar + foo; }

//// [input.ts]
let foo; function* x() { foo = bar + foo; }
