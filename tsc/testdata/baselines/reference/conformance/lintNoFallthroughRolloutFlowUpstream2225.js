//// [tests/cases/conformance/lint/rules/no-fallthrough/lintNoFallthroughRolloutFlowUpstream2225.ts] ////

//// [input.ts]
switch (foo) { case 0: try { break; } finally {} default: b(); }

//// [input.ts]
switch (foo) { case 0: try { break; } finally {} default: b(); }
