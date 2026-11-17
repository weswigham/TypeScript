//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1778.ts] ////

//// [input.ts]
function someFunc() { for (; b;) { if (foo) { return; } else { break; } bar(); } }

//// [input.ts]
function someFunc() { for (; b;) { if (foo) { return; } else { break; } bar(); } }
