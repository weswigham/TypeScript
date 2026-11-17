//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1749.ts] ////

//// [input.ts]
function someFunc() { for (; ; c++) { if (foo) { return; } else { break; } bar(); } }

//// [input.ts]
function someFunc() { for (; ; c++) { if (foo) { return; } else { break; } bar(); } }
