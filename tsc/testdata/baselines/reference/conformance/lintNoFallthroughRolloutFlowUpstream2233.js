//// [tests/cases/conformance/lint/rules/no-fallthrough/lintNoFallthroughRolloutFlowUpstream2233.ts] ////

//// [input.ts]
switch(foo) { case 0: a(); /* no break: need to execute b() */ case 1: b(); }

//// [input.ts]
switch(foo) { case 0: a(); /* no break: need to execute b() */ case 1: b(); }
