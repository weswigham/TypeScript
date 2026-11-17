//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1922.ts] ////

//// [input.ts]
function someFunc() { for (a in b) if (foo) break; else return; }

//// [input.ts]
function someFunc() { for (a in b) if (foo) break; else return; }
