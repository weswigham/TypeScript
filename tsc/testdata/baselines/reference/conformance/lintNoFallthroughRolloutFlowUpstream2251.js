//// [tests/cases/conformance/lint/rules/no-fallthrough/lintNoFallthroughRolloutFlowUpstream2251.ts] ////

//// [input.ts]
switch(foo) { case 0: if (a) { break; } default: b() }

//// [input.ts]
switch(foo) { case 0: if (a) { break; } default: b() }
