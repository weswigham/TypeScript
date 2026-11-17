//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream736.ts] ////

//// [input.ts]
function someFunc() { for (; b; c) { if (foo) { return; } bar(); } }

//// [input.ts]
function someFunc() { for (; b; c) { if (foo) { return; } bar(); } }
