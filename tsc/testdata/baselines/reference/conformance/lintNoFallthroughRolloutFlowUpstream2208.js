//// [tests/cases/conformance/lint/rules/no-fallthrough/lintNoFallthroughRolloutFlowUpstream2208.ts] ////

//// [input.ts]
switch(foo) { case 0: case 1: a(); break; case 2: b(); }

//// [input.ts]
switch(foo) { case 0: case 1: a(); break; case 2: b(); }
