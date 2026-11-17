//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1035.ts] ////

//// [input.ts]
function someFunc() { for (a; ;) while (foo) if (bar) return; }

//// [input.ts]
function someFunc() { for (a; ;) while (foo) if (bar) return; }
