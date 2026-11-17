//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1119.ts] ////

//// [input.ts]
function someFunc() { for (a in b) while (foo) if (bar) return; }

//// [input.ts]
function someFunc() { for (a in b) while (foo) if (bar) return; }
