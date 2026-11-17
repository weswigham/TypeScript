//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1864.ts] ////

//// [input.ts]
function someFunc() { for (a = 0; ;) if (foo) break; else return; }

//// [input.ts]
function someFunc() { for (a = 0; ;) if (foo) break; else return; }
