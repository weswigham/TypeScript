//// [tests/cases/conformance/lint/rules/no-fallthrough/lintNoFallthroughRolloutFlowFinallyBreak.ts] ////

//// [input.ts]
switch (x) { case 0: try { work(); } finally { break; } case 1: break; }

//// [input.ts]
switch (x) { case 0: try { work(); } finally { break; } case 1: break; }
