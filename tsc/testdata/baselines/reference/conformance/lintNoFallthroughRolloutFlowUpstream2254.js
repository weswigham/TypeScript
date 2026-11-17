//// [tests/cases/conformance/lint/rules/no-fallthrough/lintNoFallthroughRolloutFlowUpstream2254.ts] ////

//// [input.ts]
switch(foo) { case 0: do { break; } while (a); default: b() }

//// [input.ts]
switch(foo) { case 0: do { break; } while (a); default: b() }
