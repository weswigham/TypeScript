//// [tests/cases/conformance/lint/rules/no-fallthrough/lintNoFallthroughRolloutFlowUpstream2228.ts] ////

//// [input.ts]
switch (foo) { case 0: do { throw 0; } while(a); default: b(); }

//// [input.ts]
switch (foo) { case 0: do { throw 0; } while(a); default: b(); }
