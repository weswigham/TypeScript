//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream652.ts] ////

//// [input.ts]
function someFunc() { do { if (foo) { return; } bar(); } while (a && b) }

//// [input.ts]
function someFunc() { do { if (foo) { return; } bar(); } while (a && b) }
