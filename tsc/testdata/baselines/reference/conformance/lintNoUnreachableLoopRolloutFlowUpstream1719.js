//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1719.ts] ////

//// [input.ts]
function someFunc() { for (; ; c) if (foo) break; else return; }

//// [input.ts]
function someFunc() { for (; ; c) if (foo) break; else return; }
