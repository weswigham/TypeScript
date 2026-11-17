//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream783.ts] ////

//// [input.ts]
function someFunc() { for (; b < foo; c++) while (foo) if (bar) return; }

//// [input.ts]
function someFunc() { for (; b < foo; c++) while (foo) if (bar) return; }
