//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream587.ts] ////

//// [input.ts]
function someFunc() { while (a) while (foo) if (bar) return; }

//// [input.ts]
function someFunc() { while (a) while (foo) if (bar) return; }
