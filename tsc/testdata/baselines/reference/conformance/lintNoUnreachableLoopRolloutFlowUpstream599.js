//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream599.ts] ////

//// [input.ts]
function someFunc() { while (a && b) { switch (foo) { case 1: return; } } }

//// [input.ts]
function someFunc() { while (a && b) { switch (foo) { case 1: return; } } }
