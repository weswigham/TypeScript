//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1777.ts] ////

//// [input.ts]
function someFunc() { for (; b;) if (foo) break; else return; }

//// [input.ts]
function someFunc() { for (; b;) if (foo) break; else return; }
