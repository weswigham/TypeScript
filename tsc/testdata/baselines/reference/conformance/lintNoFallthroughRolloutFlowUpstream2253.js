//// [tests/cases/conformance/lint/rules/no-fallthrough/lintNoFallthroughRolloutFlowUpstream2253.ts] ////

//// [input.ts]
switch(foo) { case 0: while (a) { break; } default: b() }

//// [input.ts]
switch(foo) { case 0: while (a) { break; } default: b() }
