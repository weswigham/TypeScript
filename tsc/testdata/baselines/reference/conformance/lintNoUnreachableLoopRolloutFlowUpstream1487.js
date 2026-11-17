//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1487.ts] ////

//// [input.ts]
function someFunc() { for (a; b; c) if (foo) break; else return; }

//// [input.ts]
function someFunc() { for (a; b; c) if (foo) break; else return; }
