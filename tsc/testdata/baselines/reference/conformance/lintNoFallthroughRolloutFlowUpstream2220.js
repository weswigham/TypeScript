//// [tests/cases/conformance/lint/rules/no-fallthrough/lintNoFallthroughRolloutFlowUpstream2220.ts] ////

//// [input.ts]
switch(foo) { case 0: switch(bar) { case 2: break; } /* falls through */ case 1: break; }

//// [input.ts]
switch(foo) { case 0: switch(bar) { case 2: break; } /* falls through */ case 1: break; }
