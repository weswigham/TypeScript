//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1072.ts] ////

//// [input.ts]
function someFunc() { for (;;) { if (foo) { return; } bar(); } }

//// [input.ts]
function someFunc() { for (;;) { if (foo) { return; } bar(); } }
