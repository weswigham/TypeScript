//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream680.ts] ////

//// [input.ts]
function someFunc() { for (a; b; c) { if (foo) { return; } bar(); } }

//// [input.ts]
function someFunc() { for (a; b; c) { if (foo) { return; } bar(); } }
