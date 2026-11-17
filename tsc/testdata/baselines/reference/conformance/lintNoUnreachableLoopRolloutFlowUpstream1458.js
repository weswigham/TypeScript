//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1458.ts] ////

//// [input.ts]
function someFunc() { do if (foo) break; else return; while (a && b) }

//// [input.ts]
function someFunc() { do if (foo) break; else return; while (a && b) }
