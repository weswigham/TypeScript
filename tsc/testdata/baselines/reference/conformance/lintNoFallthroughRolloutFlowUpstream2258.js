//// [tests/cases/conformance/lint/rules/no-fallthrough/lintNoFallthroughRolloutFlowUpstream2258.ts] ////

//// [input.ts]
switch(foo) { case 0: { /* falls through */ } a(); default: b() }

//// [input.ts]
switch(foo) { case 0: { /* falls through */ } a(); default: b() }
