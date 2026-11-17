//// [tests/cases/conformance/lint/rules/no-fallthrough/lintNoFallthroughRolloutFlowUpstream2200.ts] ////

//// [input.ts]
switch(foo) { case 0: { a(); /* FALLS THROUGH */ } case 1: b(); }

//// [input.ts]
switch(foo) { case 0: { a(); /* FALLS THROUGH */ } case 1: b(); }
