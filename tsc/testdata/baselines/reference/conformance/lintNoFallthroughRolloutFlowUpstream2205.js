//// [tests/cases/conformance/lint/rules/no-fallthrough/lintNoFallthroughRolloutFlowUpstream2205.ts] ////

//// [input.ts]
switch(foo) { case 0: a(); throw 'foo'; case 1: b(); }

//// [input.ts]
switch(foo) { case 0: a(); throw 'foo'; case 1: b(); }
