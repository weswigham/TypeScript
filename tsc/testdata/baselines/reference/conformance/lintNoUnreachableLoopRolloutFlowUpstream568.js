//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream568.ts] ////

//// [input.ts]
function someFunc() { while (a) { if (foo) { return; } bar(); } }

//// [input.ts]
function someFunc() { while (a) { if (foo) { return; } bar(); } }
