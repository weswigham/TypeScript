//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1720.ts] ////

//// [input.ts]
function someFunc() { for (; ; c) { if (foo) { return; } else { break; } bar(); } }

//// [input.ts]
function someFunc() { for (; ; c) { if (foo) { return; } else { break; } bar(); } }
