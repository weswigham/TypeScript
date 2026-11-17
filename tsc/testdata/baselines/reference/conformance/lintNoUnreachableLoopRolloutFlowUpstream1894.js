//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1894.ts] ////

//// [input.ts]
function someFunc() { for (;;) { if (foo) { return; } else { break; } bar(); } }

//// [input.ts]
function someFunc() { for (;;) { if (foo) { return; } else { break; } bar(); } }
