//// [tests/cases/conformance/lint/rules/no-fallthrough/lintNoFallthroughRolloutFlowUpstream2198.ts] ////

//// [input.ts]
switch(foo) { case 0: { a(); /* fall through */ } case 1: b(); }

//// [input.ts]
switch(foo) { case 0: { a(); /* fall through */ } case 1: b(); }
