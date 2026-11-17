//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream683.ts] ////

//// [input.ts]
function someFunc() { for (a; b; c) { switch (foo) { case 1: return; } } }

//// [input.ts]
function someFunc() { for (a; b; c) { switch (foo) { case 1: return; } } }
