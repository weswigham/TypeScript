//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream656.ts] ////

//// [input.ts]
function someFunc() { do { switch (foo) { case 1: break; default: return; } } while (a && b) }

//// [input.ts]
function someFunc() { do { switch (foo) { case 1: break; default: return; } } while (a && b) }
