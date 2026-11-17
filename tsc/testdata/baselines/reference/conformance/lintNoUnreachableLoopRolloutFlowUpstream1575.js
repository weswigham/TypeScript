//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1575.ts] ////

//// [input.ts]
function someFunc() { for (; b < foo; c++) { if (foo) { return; } else { break; } bar(); } }

//// [input.ts]
function someFunc() { for (; b < foo; c++) { if (foo) { return; } else { break; } bar(); } }
