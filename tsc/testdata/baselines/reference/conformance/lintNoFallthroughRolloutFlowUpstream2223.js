//// [tests/cases/conformance/lint/rules/no-fallthrough/lintNoFallthroughRolloutFlowUpstream2223.ts] ////

//// [input.ts]
switch (foo) { case 0: a(); /* falls through */ default: /* comment */ b(); }

//// [input.ts]
switch (foo) { case 0: a(); /* falls through */ default: /* comment */ b(); }
