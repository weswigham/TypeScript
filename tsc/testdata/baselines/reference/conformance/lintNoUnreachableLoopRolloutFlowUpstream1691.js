//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1691.ts] ////

//// [input.ts]
function someFunc() { for (a = 0; b < foo; ) { if (foo) { return; } else { break; } bar(); } }

//// [input.ts]
function someFunc() { for (a = 0; b < foo; ) { if (foo) { return; } else { break; } bar(); } }
