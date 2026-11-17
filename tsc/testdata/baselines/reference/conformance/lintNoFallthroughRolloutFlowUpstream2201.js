//// [tests/cases/conformance/lint/rules/no-fallthrough/lintNoFallthroughRolloutFlowUpstream2201.ts] ////

//// [input.ts]
switch(foo) { case 0: { a(); } /* falls through */ case 1: b(); }

//// [input.ts]
switch(foo) { case 0: { a(); } /* falls through */ case 1: b(); }
