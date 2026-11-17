//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream1231.ts] ////

//// [input.ts]
function someFunc() { for (a of b) while (foo) if (bar) return; }

//// [input.ts]
function someFunc() { for (a of b) while (foo) if (bar) return; }
