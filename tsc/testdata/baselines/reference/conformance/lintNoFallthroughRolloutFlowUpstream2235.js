//// [tests/cases/conformance/lint/rules/no-fallthrough/lintNoFallthroughRolloutFlowUpstream2235.ts] ////

//// [input.ts]
switch(foo) { case 0: a(); /* break omitted */ default:  b(); /* comment */ }

//// [input.ts]
switch(foo) { case 0: a(); /* break omitted */ default:  b(); /* comment */ }
