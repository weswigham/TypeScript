//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1429.ts] ////

//// [input.ts]
function someFunc() { do if (foo) break; else return; while (a) }

//// [input.ts]
function someFunc() { do if (foo) break; else return; while (a) }
