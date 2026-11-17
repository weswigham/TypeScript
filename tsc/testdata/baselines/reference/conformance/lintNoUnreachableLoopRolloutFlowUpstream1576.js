//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1576.ts] ////

//// [input.ts]
function someFunc() { for (; b < foo; c++) { if (foo) { return; } throw err; } }

//// [input.ts]
function someFunc() { for (; b < foo; c++) { if (foo) { return; } throw err; } }
