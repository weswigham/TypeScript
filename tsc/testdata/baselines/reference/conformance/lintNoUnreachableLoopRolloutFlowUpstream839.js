//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream839.ts] ////

//// [input.ts]
function someFunc() { for (a = 0; ; c++) while (foo) if (bar) return; }

//// [input.ts]
function someFunc() { for (a = 0; ; c++) while (foo) if (bar) return; }
