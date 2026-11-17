//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream876.ts] ////

//// [input.ts]
function someFunc() { for (a = 0; b < foo; ) { if (foo) { return; } bar(); } }

//// [input.ts]
function someFunc() { for (a = 0; b < foo; ) { if (foo) { return; } bar(); } }
