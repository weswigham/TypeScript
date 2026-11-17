//// [tests/cases/conformance/lint/rules/no-fallthrough/lintNoFallthroughRolloutFlowUpstream2260.ts] ////

//// [input.ts]
switch(foo) { case 0: { { /* falls through */ } } default: b() }

//// [input.ts]
switch(foo) { case 0: { { /* falls through */ } } default: b() }
