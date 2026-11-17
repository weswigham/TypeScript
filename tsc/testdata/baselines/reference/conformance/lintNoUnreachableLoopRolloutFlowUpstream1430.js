//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1430.ts] ////

//// [input.ts]
function someFunc() { do { if (foo) { return; } else { break; } bar(); } while (a) }

//// [input.ts]
function someFunc() { do { if (foo) { return; } else { break; } bar(); } while (a) }
