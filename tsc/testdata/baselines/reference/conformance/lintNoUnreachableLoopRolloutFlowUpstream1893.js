//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1893.ts] ////

//// [input.ts]
function someFunc() { for (;;) if (foo) break; else return; }

//// [input.ts]
function someFunc() { for (;;) if (foo) break; else return; }
