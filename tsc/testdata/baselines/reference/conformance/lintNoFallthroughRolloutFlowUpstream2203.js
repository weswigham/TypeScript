//// [tests/cases/conformance/lint/rules/no-fallthrough/lintNoFallthroughRolloutFlowUpstream2203.ts] ////

//// [input.ts]
switch(foo) { case 0: { /* falls through */ } case 1: b(); }

//// [input.ts]
switch(foo) { case 0: { /* falls through */ } case 1: b(); }
