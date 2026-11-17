//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream624.ts] ////

//// [input.ts]
function someFunc() { do { if (foo) { return; } bar(); } while (a) }

//// [input.ts]
function someFunc() { do { if (foo) { return; } bar(); } while (a) }
