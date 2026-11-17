//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream988.ts] ////

//// [input.ts]
function someFunc() { for (; b < foo; ) { if (foo) { return; } bar(); } }

//// [input.ts]
function someFunc() { for (; b < foo; ) { if (foo) { return; } bar(); } }
