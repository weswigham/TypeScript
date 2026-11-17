//// [tests/cases/conformance/lint/rules/no-unreachable-loop/lintNoUnreachableLoopRolloutFlowUpstream573.ts] ////

//// [input.ts]
function someFunc() { while (a) { switch (foo) { case 1: continue; default: return; } throw err; } }

//// [input.ts]
function someFunc() { while (a) { switch (foo) { case 1: continue; default: return; } throw err; } }
