//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream596.ts] ////

//// [input.ts]
function someFunc() { while (a && b) { if (foo) { return; } bar(); } }

//// [input.ts]
function someFunc() { while (a && b) { if (foo) { return; } bar(); } }
