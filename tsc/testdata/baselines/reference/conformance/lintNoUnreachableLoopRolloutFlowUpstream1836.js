//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1836.ts] ////

//// [input.ts]
function someFunc() { for (a; ;) { if (foo) { return; } else { break; } bar(); } }

//// [input.ts]
function someFunc() { for (a; ;) { if (foo) { return; } else { break; } bar(); } }
