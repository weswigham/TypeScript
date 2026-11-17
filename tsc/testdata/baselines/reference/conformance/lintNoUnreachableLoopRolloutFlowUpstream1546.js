//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1546.ts] ////

//// [input.ts]
function someFunc() { for (; b; c) { if (foo) { return; } else { break; } bar(); } }

//// [input.ts]
function someFunc() { for (; b; c) { if (foo) { return; } else { break; } bar(); } }
