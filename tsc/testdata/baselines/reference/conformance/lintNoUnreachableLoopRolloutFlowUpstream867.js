//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream867.ts] ////

//// [input.ts]
function someFunc() { for (a; b;) while (foo) if (bar) return; }

//// [input.ts]
function someFunc() { for (a; b;) while (foo) if (bar) return; }
