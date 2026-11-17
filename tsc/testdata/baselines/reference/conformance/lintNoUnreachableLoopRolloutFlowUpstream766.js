//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream766.ts] ////

//// [input.ts]
function someFunc() { for (; b < foo; c++) { if (foo) { continue; } return; } }

//// [input.ts]
function someFunc() { for (; b < foo; c++) { if (foo) { continue; } return; } }
