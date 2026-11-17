//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream951.ts] ////

//// [input.ts]
function someFunc() { for (; ; c++) while (foo) if (bar) return; }

//// [input.ts]
function someFunc() { for (; ; c++) while (foo) if (bar) return; }
