//// [tests/cases/conformance/lint/rules/no-fallthrough/lintNoFallthroughRolloutFlowUpstream2202.ts] ////

//// [input.ts]
switch(foo) { case 0: { a(); /* falls through */ } /* comment */ case 1: b(); }

//// [input.ts]
switch(foo) { case 0: { a(); /* falls through */ } /* comment */ case 1: b(); }
