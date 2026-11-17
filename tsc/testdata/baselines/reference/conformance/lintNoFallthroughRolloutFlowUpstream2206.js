//// [tests/cases/conformance/lint/rules/no-fallthrough/lintNoFallthroughRolloutFlowUpstream2206.ts] ////

//// [input.ts]
while (a) { switch(foo) { case 0: a(); continue; case 1: b(); } }

//// [input.ts]
while (a) { switch(foo) { case 0: a(); continue; case 1: b(); } }
