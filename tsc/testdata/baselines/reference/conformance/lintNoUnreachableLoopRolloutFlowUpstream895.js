//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream895.ts] ////

//// [input.ts]
function someFunc() { for (a = 0; b < foo; ) while (foo) if (bar) return; }

//// [input.ts]
function someFunc() { for (a = 0; b < foo; ) while (foo) if (bar) return; }
