//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1401.ts] ////

//// [input.ts]
function someFunc() { while (a && b) { if (foo) { return; } else { break; } bar(); } }

//// [input.ts]
function someFunc() { while (a && b) { if (foo) { return; } else { break; } bar(); } }
