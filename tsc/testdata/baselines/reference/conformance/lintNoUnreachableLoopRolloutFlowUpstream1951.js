//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1951.ts] ////

//// [input.ts]
function someFunc() { for (a in f(b)) if (foo) break; else return; }

//// [input.ts]
function someFunc() { for (a in f(b)) if (foo) break; else return; }
