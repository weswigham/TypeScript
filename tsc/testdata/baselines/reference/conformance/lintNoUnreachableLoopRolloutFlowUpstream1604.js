//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1604.ts] ////

//// [input.ts]
function someFunc() { for (a; ; c) { if (foo) { return; } else { break; } bar(); } }

//// [input.ts]
function someFunc() { for (a; ; c) { if (foo) { return; } else { break; } bar(); } }
