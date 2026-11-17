//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1128.ts] ////

//// [input.ts]
function someFunc() { for (a in f(b)) { if (foo) { return; } bar(); } }

//// [input.ts]
function someFunc() { for (a in f(b)) { if (foo) { return; } bar(); } }
