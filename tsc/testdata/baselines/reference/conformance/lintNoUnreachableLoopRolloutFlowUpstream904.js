//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream904.ts] ////

//// [input.ts]
function someFunc() { for (; ; c) { if (foo) { return; } bar(); } }

//// [input.ts]
function someFunc() { for (; ; c) { if (foo) { return; } bar(); } }
