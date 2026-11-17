//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1488.ts] ////

//// [input.ts]
function someFunc() { for (a; b; c) { if (foo) { return; } else { break; } bar(); } }

//// [input.ts]
function someFunc() { for (a; b; c) { if (foo) { return; } else { break; } bar(); } }
