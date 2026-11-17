//// [tests/cases/conformance/lint/rules/no-fallthrough/lintNoFallthroughRolloutFlowUpstream2232.ts] ////

//// [input.ts]
switch(foo) { case 0: a(); /* no break */ case 1: b(); }

//// [input.ts]
switch(foo) { case 0: a(); /* no break */ case 1: b(); }
