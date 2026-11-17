//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1632.ts] ////

//// [input.ts]
function someFunc() { for (a = 0; ; c++) if (foo) break; else return; }

//// [input.ts]
function someFunc() { for (a = 0; ; c++) if (foo) break; else return; }
