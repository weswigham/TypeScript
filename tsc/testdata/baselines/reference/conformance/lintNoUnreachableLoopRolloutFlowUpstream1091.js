//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1091.ts] ////

//// [input.ts]
function someFunc() { for (;;) while (foo) if (bar) return; }

//// [input.ts]
function someFunc() { for (;;) while (foo) if (bar) return; }
