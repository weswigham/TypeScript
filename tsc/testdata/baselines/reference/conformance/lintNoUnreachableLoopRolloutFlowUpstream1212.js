//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1212.ts] ////

//// [input.ts]
function someFunc() { for (a of b) { if (foo) { return; } bar(); } }

//// [input.ts]
function someFunc() { for (a of b) { if (foo) { return; } bar(); } }
