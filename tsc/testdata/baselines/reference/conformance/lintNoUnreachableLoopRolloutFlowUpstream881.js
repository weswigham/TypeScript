//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream881.ts] ////

//// [input.ts]
function someFunc() { for (a = 0; b < foo; ) { switch (foo) { case 1: continue; default: return; } throw err; } }

//// [input.ts]
function someFunc() { for (a = 0; b < foo; ) { switch (foo) { case 1: continue; default: return; } throw err; } }
