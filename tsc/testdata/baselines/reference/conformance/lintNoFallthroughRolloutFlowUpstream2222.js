//// [tests/cases/conformance/lint/rules/no-fallthrough/lintNoFallthroughRolloutFlowUpstream2222.ts] ////

//// [input.ts]
switch (foo) { case 0: a(); /* falls through */ default:  b(); /* comment */ }

//// [input.ts]
switch (foo) { case 0: a(); /* falls through */ default:  b(); /* comment */ }
