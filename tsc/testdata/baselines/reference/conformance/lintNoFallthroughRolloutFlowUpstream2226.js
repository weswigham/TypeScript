//// [tests/cases/conformance/lint/rules/no-fallthrough/lintNoFallthroughRolloutFlowUpstream2226.ts] ////

//// [input.ts]
switch (foo) { case 0: try {} finally { break; } default: b(); }

//// [input.ts]
switch (foo) { case 0: try {} finally { break; } default: b(); }
