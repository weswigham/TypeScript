//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1923.ts] ////

//// [input.ts]
function someFunc() { for (a in b) { if (foo) { return; } else { break; } bar(); } }

//// [input.ts]
function someFunc() { for (a in b) { if (foo) { return; } else { break; } bar(); } }
