//// [tests/cases/conformance/lint/rules/no-fallthrough/lintNoFallthroughRolloutFlowUpstream2194.ts] ////

//// [input.ts]
switch(foo) { case 0: a(); /* fallthrough */ case 1: b(); }

//// [input.ts]
switch(foo) { case 0: a(); /* fallthrough */ case 1: b(); }
