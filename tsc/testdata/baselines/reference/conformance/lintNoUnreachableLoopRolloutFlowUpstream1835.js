//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1835.ts] ////

//// [input.ts]
function someFunc() { for (a; ;) if (foo) break; else return; }

//// [input.ts]
function someFunc() { for (a; ;) if (foo) break; else return; }
