//// [tests/cases/conformance/lint/rules/no-fallthrough/lintNoFallthroughRolloutFlowUpstream2257.ts] ////

//// [input.ts]
switch(foo) { case 0: a(); { /* falls through */ } default: b() }

//// [input.ts]
switch(foo) { case 0: a(); { /* falls through */ } default: b() }
