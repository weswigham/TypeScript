//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1603.ts] ////

//// [input.ts]
function someFunc() { for (a; ; c) if (foo) break; else return; }

//// [input.ts]
function someFunc() { for (a; ; c) if (foo) break; else return; }
