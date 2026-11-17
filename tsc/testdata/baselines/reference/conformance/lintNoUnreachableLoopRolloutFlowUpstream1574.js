//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1574.ts] ////

//// [input.ts]
function someFunc() { for (; b < foo; c++) if (foo) break; else return; }

//// [input.ts]
function someFunc() { for (; b < foo; c++) if (foo) break; else return; }
