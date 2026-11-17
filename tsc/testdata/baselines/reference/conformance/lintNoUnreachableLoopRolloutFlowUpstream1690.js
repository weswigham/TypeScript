//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1690.ts] ////

//// [input.ts]
function someFunc() { for (a = 0; b < foo; ) if (foo) break; else return; }

//// [input.ts]
function someFunc() { for (a = 0; b < foo; ) if (foo) break; else return; }
