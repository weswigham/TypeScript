//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream626.ts] ////

//// [input.ts]
function someFunc() { do { if (foo) { continue; } return; } while (a) }

//// [input.ts]
function someFunc() { do { if (foo) { continue; } return; } while (a) }
