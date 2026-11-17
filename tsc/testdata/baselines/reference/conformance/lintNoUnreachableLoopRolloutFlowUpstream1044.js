//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1044.ts] ////

//// [input.ts]
function someFunc() { for (a = 0; ;) { if (foo) { return; } bar(); } }

//// [input.ts]
function someFunc() { for (a = 0; ;) { if (foo) { return; } bar(); } }
