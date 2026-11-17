//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1807.ts] ////

//// [input.ts]
function someFunc() { for (; b < foo; ) { if (foo) { return; } else { break; } bar(); } }

//// [input.ts]
function someFunc() { for (; b < foo; ) { if (foo) { return; } else { break; } bar(); } }
