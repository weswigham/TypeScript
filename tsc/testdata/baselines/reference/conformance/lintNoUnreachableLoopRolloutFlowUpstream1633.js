//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1633.ts] ////

//// [input.ts]
function someFunc() { for (a = 0; ; c++) { if (foo) { return; } else { break; } bar(); } }

//// [input.ts]
function someFunc() { for (a = 0; ; c++) { if (foo) { return; } else { break; } bar(); } }
