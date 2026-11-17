//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1156.ts] ////

//// [input.ts]
function someFunc() { for (var a in b) { if (foo) { return; } bar(); } }

//// [input.ts]
function someFunc() { for (var a in b) { if (foo) { return; } bar(); } }
