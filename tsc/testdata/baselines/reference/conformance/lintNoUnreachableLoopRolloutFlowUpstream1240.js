//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1240.ts] ////

//// [input.ts]
function someFunc() { for (a of f(b)) { if (foo) { return; } bar(); } }

//// [input.ts]
function someFunc() { for (a of f(b)) { if (foo) { return; } bar(); } }
