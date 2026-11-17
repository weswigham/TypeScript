//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream880.ts] ////

//// [input.ts]
function someFunc() { for (a = 0; b < foo; ) { switch (foo) { case 1: break; default: return; } } }

//// [input.ts]
function someFunc() { for (a = 0; b < foo; ) { switch (foo) { case 1: break; default: return; } } }
