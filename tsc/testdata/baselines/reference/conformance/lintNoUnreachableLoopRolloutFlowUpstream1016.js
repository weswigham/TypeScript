//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1016.ts] ////

//// [input.ts]
function someFunc() { for (a; ;) { if (foo) { return; } bar(); } }

//// [input.ts]
function someFunc() { for (a; ;) { if (foo) { return; } bar(); } }
