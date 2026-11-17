//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream699.ts] ////

//// [input.ts]
function someFunc() { for (a; b; c) while (foo) if (bar) return; }

//// [input.ts]
function someFunc() { for (a; b; c) while (foo) if (bar) return; }
