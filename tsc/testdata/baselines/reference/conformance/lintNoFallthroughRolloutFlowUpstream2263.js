//// [tests/cases/conformance/lint/rules/no-fallthrough/lintNoFallthroughRolloutFlowUpstream2263.ts] ////

//// [input.ts]
switch(foo) { case 0: a(); /* falling through */ default: b() }

//// [input.ts]
switch(foo) { case 0: a(); /* falling through */ default: b() }
