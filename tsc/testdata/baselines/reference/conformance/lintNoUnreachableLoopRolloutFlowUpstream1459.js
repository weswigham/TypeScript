//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1459.ts] ////

//// [input.ts]
function someFunc() { do { if (foo) { return; } else { break; } bar(); } while (a && b) }

//// [input.ts]
function someFunc() { do { if (foo) { return; } else { break; } bar(); } while (a && b) }
