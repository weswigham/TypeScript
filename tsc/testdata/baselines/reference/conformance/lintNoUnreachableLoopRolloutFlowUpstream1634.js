//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1634.ts] ////

//// [input.ts]
function someFunc() { for (a = 0; ; c++) { if (foo) { return; } throw err; } }

//// [input.ts]
function someFunc() { for (a = 0; ; c++) { if (foo) { return; } throw err; } }
