//// [tests/cases/conformance/lint/rules/no-fallthrough/lintNoFallthroughRolloutFlowUpstream2224.ts] ////

//// [input.ts]
switch (foo) { case 0: if (a) { break; } else { throw 0; } default: b(); }

//// [input.ts]
switch (foo) { case 0: if (a) { break; } else { throw 0; } default: b(); }
