//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream755.ts] ////

//// [input.ts]
function someFunc() { for (; b; c) while (foo) if (bar) return; }

//// [input.ts]
function someFunc() { for (; b; c) while (foo) if (bar) return; }
