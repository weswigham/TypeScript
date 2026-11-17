//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1400.ts] ////

//// [input.ts]
function someFunc() { while (a && b) if (foo) break; else return; }

//// [input.ts]
function someFunc() { while (a && b) if (foo) break; else return; }
