//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1063.ts] ////

//// [input.ts]
function someFunc() { for (a = 0; ;) while (foo) if (bar) return; }

//// [input.ts]
function someFunc() { for (a = 0; ;) while (foo) if (bar) return; }
