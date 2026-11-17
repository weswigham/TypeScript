//// [tests/cases/conformance/lint/rules/no-fallthrough/lintNoFallthroughRolloutFlowUpstream2259.ts] ////

//// [input.ts]
switch(foo) { case 0: if (a) { /* falls through */ } default: b() }

//// [input.ts]
switch(foo) { case 0: if (a) { /* falls through */ } default: b() }
