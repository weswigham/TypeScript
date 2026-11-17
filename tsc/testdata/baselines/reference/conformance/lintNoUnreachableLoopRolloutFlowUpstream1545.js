//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1545.ts] ////

//// [input.ts]
function someFunc() { for (; b; c) if (foo) break; else return; }

//// [input.ts]
function someFunc() { for (; b; c) if (foo) break; else return; }
