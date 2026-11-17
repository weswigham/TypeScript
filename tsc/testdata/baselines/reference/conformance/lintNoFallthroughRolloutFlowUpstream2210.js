//// [tests/cases/conformance/lint/rules/no-fallthrough/lintNoFallthroughRolloutFlowUpstream2210.ts] ////

//// [input.ts]
switch(foo) { case 0: case 1: break; default: b(); }

//// [input.ts]
switch(foo) { case 0: case 1: break; default: b(); }
