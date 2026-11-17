//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream2039.ts] ////

//// [input.ts]
function someFunc() { for (a of b) { if (foo) { return; } else { break; } bar(); } }

//// [input.ts]
function someFunc() { for (a of b) { if (foo) { return; } else { break; } bar(); } }
