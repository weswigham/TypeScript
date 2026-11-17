//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1100.ts] ////

//// [input.ts]
function someFunc() { for (a in b) { if (foo) { return; } bar(); } }

//// [input.ts]
function someFunc() { for (a in b) { if (foo) { return; } bar(); } }
