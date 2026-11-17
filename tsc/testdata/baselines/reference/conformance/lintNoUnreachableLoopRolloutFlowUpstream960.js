//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream960.ts] ////

//// [input.ts]
function someFunc() { for (; b;) { if (foo) { return; } bar(); } }

//// [input.ts]
function someFunc() { for (; b;) { if (foo) { return; } bar(); } }
