//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1865.ts] ////

//// [input.ts]
function someFunc() { for (a = 0; ;) { if (foo) { return; } else { break; } bar(); } }

//// [input.ts]
function someFunc() { for (a = 0; ;) { if (foo) { return; } else { break; } bar(); } }
