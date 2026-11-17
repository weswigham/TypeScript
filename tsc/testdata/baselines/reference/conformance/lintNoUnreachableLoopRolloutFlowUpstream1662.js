//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1662.ts] ////

//// [input.ts]
function someFunc() { for (a; b;) { if (foo) { return; } else { break; } bar(); } }

//// [input.ts]
function someFunc() { for (a; b;) { if (foo) { return; } else { break; } bar(); } }
