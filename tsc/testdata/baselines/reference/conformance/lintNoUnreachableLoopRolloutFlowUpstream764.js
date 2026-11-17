//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream764.ts] ////

//// [input.ts]
function someFunc() { for (; b < foo; c++) { if (foo) { return; } bar(); } }

//// [input.ts]
function someFunc() { for (; b < foo; c++) { if (foo) { return; } bar(); } }
