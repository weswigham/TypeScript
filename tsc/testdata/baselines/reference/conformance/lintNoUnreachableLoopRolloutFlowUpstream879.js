//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream879.ts] ////

//// [input.ts]
function someFunc() { for (a = 0; b < foo; ) { switch (foo) { case 1: return; } } }

//// [input.ts]
function someFunc() { for (a = 0; b < foo; ) { switch (foo) { case 1: return; } } }
