//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream571.ts] ////

//// [input.ts]
function someFunc() { while (a) { switch (foo) { case 1: return; } } }

//// [input.ts]
function someFunc() { while (a) { switch (foo) { case 1: return; } } }
