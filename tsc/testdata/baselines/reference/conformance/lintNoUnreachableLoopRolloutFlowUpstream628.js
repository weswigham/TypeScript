//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream628.ts] ////

//// [input.ts]
function someFunc() { do { switch (foo) { case 1: break; default: return; } } while (a) }

//// [input.ts]
function someFunc() { do { switch (foo) { case 1: break; default: return; } } while (a) }
