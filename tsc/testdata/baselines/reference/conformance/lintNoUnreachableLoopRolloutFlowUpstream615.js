//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream615.ts] ////

//// [input.ts]
function someFunc() { while (a && b) while (foo) if (bar) return; }

//// [input.ts]
function someFunc() { while (a && b) while (foo) if (bar) return; }
