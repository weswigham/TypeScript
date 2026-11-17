//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream848.ts] ////

//// [input.ts]
function someFunc() { for (a; b;) { if (foo) { return; } bar(); } }

//// [input.ts]
function someFunc() { for (a; b;) { if (foo) { return; } bar(); } }
