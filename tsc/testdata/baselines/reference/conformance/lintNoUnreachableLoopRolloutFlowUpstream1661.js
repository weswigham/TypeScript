//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1661.ts] ////

//// [input.ts]
function someFunc() { for (a; b;) if (foo) break; else return; }

//// [input.ts]
function someFunc() { for (a; b;) if (foo) break; else return; }
